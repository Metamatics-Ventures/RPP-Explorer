# Records copied from mapastatu.cz. in profile default (zone /hostedzone/Z0921643VU0QLDAEWVH6) by aws-infra/scripts/zone-to-tf.

resource "aws_route53_record" "etalon_mapastatu_cz_a" {
  zone_id         = aws_route53_zone.main.zone_id
  name            = "etalon.mapastatu.cz"
  type            = "A"
  allow_overwrite = true
  ttl             = 300
  records         = ["136.82.25.144"]
}


# etalon.mapastatu.cz belongs to app dia-etalon (stays in 944599182879). Its ACM certificate there
# (us-east-1, 25f1c88b-...) renews through this validation CNAME, so it is carried over unchanged.
resource "aws_route53_record" "etalon_mapastatu_cz_acm_validation" {
  zone_id         = aws_route53_zone.main.zone_id
  name            = "_19662d57c55768b04eabc1dacb9cb36e.etalon.mapastatu.cz"
  type            = "CNAME"
  allow_overwrite = true
  ttl             = 300
  records         = ["_44d8f78dfcd599797c10c1996971262b.wzccmgtwzk.acm-validations.aws."]
}
