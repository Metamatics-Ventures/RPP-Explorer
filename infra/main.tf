# Mapa státu (mapastatu.cz) — AWS 472542740583 (profile startups), eu-north-1. Skill aws-infra.
# Moved from 944599182879 (us-east-1: 10 S3 buckets *-mapastatu-cz + 9 CloudFront distributions;
# eu-central-1: NL->SQL backend rpp-nl-query, table rpp-feedback) on 2026-11-20.
#   terraform init && terraform apply && ../deploy.sh <site> <dir> [prefix]
#
# One zone, one static-site module per subsite, plus the NL->SQL backend used by mapastatu.cz/#/zeptejse.
# etalon.mapastatu.cz is app dia-etalon and stays in 944599182879 (record copied in zone_records.tf).

terraform {
  required_version = ">= 1.10"
  required_providers {
    aws     = { source = "hashicorp/aws", version = "~> 6.0" }
    archive = { source = "hashicorp/archive", version = "~> 2.4" }
  }
  backend "s3" {
    bucket       = "tfstate-472542740583"
    key          = "mapastatu/prod.tfstate"
    region       = "eu-north-1"
    profile      = "startups"
    use_lockfile = true
    encrypt      = true
  }
}

variable "domain" {
  type    = string
  default = "mapastatu.cz"
}
# Live zone in 944599182879 until the registrar uses the new nameservers. Set "" after the switch.
variable "legacy_zone_id" {
  type    = string
  default = "Z0921643VU0QLDAEWVH6"
}
variable "region" {
  type    = string
  default = "eu-north-1"
}
# Bedrock: EU cross-region profile (copied into an application inference profile tagged app=mapastatu).
variable "bedrock_source_profile" {
  type    = string
  default = "eu.anthropic.claude-haiku-4-5-20251001-v1:0"
}

locals {
  app     = "mapastatu"
  name    = "mapastatu-prod"
  account = data.aws_caller_identity.current.account_id
  tags    = { app = local.app, env = "prod", owner = "jakub", managed-by = "terraform", repo = "ngo/rpp-explorer" }

  # key => hosts and CloudFront behaviour (same as the old distributions in 944599182879)
  sites = {
    www            = { hosts = [var.domain, "www.${var.domain}"], spa = true }                                     # was mapastatu-cz, E26VXNAUBDRZBF
    digitalizace   = { hosts = ["digitalizace.${var.domain}"], spa = false }                                       # was EA0GTK5WNJL5Y
    dopady         = { hosts = ["dopady.${var.domain}"], spa = false }                                             # was E32Q2B4CXBIZH7
    kompetitivnost = { hosts = ["kompetitivnost.${var.domain}"], spa = true }                                      # was E3GTSZXJTM8L9Y
    krizoverizeni  = { hosts = ["krizoverizeni.${var.domain}", "krizovapripravenost.${var.domain}"], spa = false } # was EHTQCU59J0153
    krizovescenare = { hosts = ["krizovescenare.${var.domain}"], spa = false }                                     # was EG4F3ACD6531G
    simulace       = { hosts = ["simulace.${var.domain}"], spa = false }                                           # was E18CZCWKLFHLHL
    situace        = { hosts = ["situace.${var.domain}"], spa = true }                                             # was E1QNY741Z6LZ2X
    zakony         = { hosts = ["zakony.${var.domain}"], spa = false }                                             # was E2WP627Y2B2U57 (root object balance.html, see below)
  }
}

data "aws_caller_identity" "current" {}

provider "aws" {
  region  = var.region
  profile = "startups"
  default_tags { tags = local.tags }
}
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = "startups"
  default_tags { tags = local.tags }
}
provider "aws" {
  alias   = "legacy"
  region  = "us-east-1"
  profile = "default"
}

resource "aws_resourcegroups_group" "app" {
  name        = "app-${local.app}"
  description = "All resources of mapastatu - tag app is mapastatu"
  resource_query {
    query = jsonencode({ ResourceTypeFilters = ["AWS::AllSupported"], TagFilters = [{ Key = "app", Values = [local.app] }] })
  }
}

resource "aws_route53_zone" "main" {
  name    = var.domain
  comment = "mapastatu.cz - moved from 944599182879"
}

module "site" {
  source         = "/Users/jakubbares/.claude/skills/aws-infra/templates/terraform/modules/static-site"
  for_each       = local.sites
  providers      = { aws = aws, aws.us_east_1 = aws.us_east_1, aws.legacy = aws.legacy }
  name           = "${local.name}-${each.key}"
  hosts          = each.value.hosts
  spa            = each.value.spa
  zone_id        = aws_route53_zone.main.zone_id
  legacy_zone_id = var.legacy_zone_id
}

# ---------------------------------------------------------------- zakony: "/" is balance.html
# The old distribution had DefaultRootObject balance.html, while /index.html is a different page
# (the audit framework, linked from audit.html). The module always uses index.html, so the front
# door gets one more specific route: GET / -> CloudFront /balance.html (method routes win over ANY).

# Read at plan time (no depends_on, so the route is not replaced on every apply). On a fresh build
# run `terraform apply -target=module.site` first, then the full apply.
data "aws_apigatewayv2_apis" "zakony" {
  name          = "${local.name}-zakony-front"
  protocol_type = "HTTP"
}

locals {
  zakony_api_id = one(data.aws_apigatewayv2_apis.zakony.ids)
}

resource "aws_apigatewayv2_integration" "zakony_root" {
  api_id             = local.zakony_api_id
  integration_type   = "HTTP_PROXY"
  integration_method = "GET"
  integration_uri    = "https://${module.site["zakony"].distribution_domain}/balance.html"
}

resource "aws_apigatewayv2_route" "zakony_root" {
  api_id    = local.zakony_api_id
  route_key = "GET /"
  target    = "integrations/${aws_apigatewayv2_integration.zakony_root.id}"
}

# ---------------------------------------------------------------- NL->SQL backend (mapastatu.cz/#/zeptejse + feedback)
# Lambda (Node 22, arm64) -> Bedrock Claude Haiku 4.5 (EU profile). Feedback and questions go to DynamoDB.
# Code: ../backend/nl-query (index.mjs + sql.js). The front end calls output nlq_endpoint
# (app/features/feat_nlquery.js, feat_feedback.js).

resource "aws_dynamodb_table" "feedback" {
  name         = "${local.name}-feedback"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  point_in_time_recovery { enabled = true }
}

resource "aws_bedrock_inference_profile" "haiku" {
  name        = "${local.name}-haiku"
  description = "Mapa statu NL to SQL dashboards"
  model_source {
    copy_from = "arn:aws:bedrock:${var.region}:${local.account}:inference-profile/${var.bedrock_source_profile}"
  }
  tags = local.tags
}

data "archive_file" "nlq" {
  type        = "zip"
  output_path = "${path.module}/.build/nl-query.zip"
  source_dir  = "${path.module}/../backend/nl-query"
  excludes    = ["test", "test/**"]
}

resource "aws_cloudwatch_log_group" "nlq" {
  name              = "/aws/lambda/${local.name}-nl-query"
  retention_in_days = 30
}

resource "aws_iam_role" "nlq" {
  name = "${local.name}-nl-query"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy" "nlq" {
  name = "nl-query"
  role = aws_iam_role.nlq.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "${aws_cloudwatch_log_group.nlq.arn}:*" },
      { Effect = "Allow", Action = ["dynamodb:PutItem"], Resource = aws_dynamodb_table.feedback.arn },
      { Effect = "Allow", Action = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"], Resource = [
        aws_bedrock_inference_profile.haiku.arn,
        "arn:aws:bedrock:${var.region}:${local.account}:inference-profile/${var.bedrock_source_profile}",
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5*",
      ] },
    ]
  })
}

resource "aws_lambda_function" "nlq" {
  function_name    = "${local.name}-nl-query"
  role             = aws_iam_role.nlq.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = data.archive_file.nlq.output_path
  source_code_hash = data.archive_file.nlq.output_base64sha256
  memory_size      = 1024
  timeout          = 30
  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.nlq.name
  }
  environment {
    variables = {
      BEDROCK_MODEL  = aws_bedrock_inference_profile.haiku.arn
      BEDROCK_REGION = var.region
      FEEDBACK_TABLE = aws_dynamodb_table.feedback.name
    }
  }
}

# CORS is answered by the function itself (allows https://mapastatu.cz, https://www.mapastatu.cz, localhost).
resource "aws_apigatewayv2_api" "nlq" {
  name          = "${local.name}-nl-query"
  protocol_type = "HTTP"
  description   = "mapastatu.cz NL to SQL and feedback"
}

resource "aws_apigatewayv2_integration" "nlq" {
  api_id                 = aws_apigatewayv2_api.nlq.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.nlq.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_route" "nlq" {
  api_id    = aws_apigatewayv2_api.nlq.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.nlq.id}"
}

# Each call costs Bedrock tokens: throttled to keep a runaway client cheap.
resource "aws_apigatewayv2_stage" "nlq" {
  api_id      = aws_apigatewayv2_api.nlq.id
  name        = "$default"
  auto_deploy = true
  default_route_settings {
    throttling_burst_limit = 20
    throttling_rate_limit  = 5
  }
}

resource "aws_lambda_permission" "nlq" {
  statement_id  = "apigw"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.nlq.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.nlq.execution_arn}/*/*"
}

# ---------------------------------------------------------------- outputs

output "buckets" { value = { for k, m in module.site : k => m.bucket } }
output "distribution_ids" { value = { for k, m in module.site : k => m.distribution_id } }
output "distribution_domains" { value = { for k, m in module.site : k => m.distribution_domain } }
output "nlq_endpoint" { value = aws_apigatewayv2_api.nlq.api_endpoint }
output "feedback_table" { value = aws_dynamodb_table.feedback.name }
output "bedrock_profile" { value = aws_bedrock_inference_profile.haiku.arn }
output "nameservers" { value = aws_route53_zone.main.name_servers }
