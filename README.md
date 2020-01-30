# Wuhan-Coronavirus-API
API Service for tracking the Wuhan Coronavirus

## Try it
[![Run on Ainize](https://ainize.ai/static/images/run_on_ainize_button.svg)](https://ainize.web.app/redirect?git_repo=github.com/Laeyoung/Wuhan-Coronavirus-API)

## API Document

### Endpoint
https://endpoint.ainize.ai/laeyoung/wuhan-coronavirus-api

### Brief

**Request:**
```json
GET /jhu-edu/brief
```
**Successful Response:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
	"confirmed": 7783,
	"deaths": 170,
	"recovered": 133
}
```

**Curl:**
```sh
curl -X GET "https://endpoint.ainize.ai/laeyoung/wuhan-coronavirus-api/jhu-edu/brief" -H "accept: application/json"
```

**Browser:**
https://endpoint.ainize.ai/laeyoung/wuhan-coronavirus-api/jhu-edu/brief

### Latest

**Request:**
```json
GET /jhu-edu/latest
```
**Successful Response:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

[{
	"provincestate": "Hubei",
	"countryregion": "Mainland China",
	"lastupdate": "1/29/2020 21:00",
	"confirmed": "4586",
	"deaths": "162",
	"recovered": "90"
}, {
	"provincestate": "Zhejiang",
	"countryregion": "Mainland China",
	"lastupdate": "1/29/2020 21:00",
	"confirmed": "428",
	"deaths": "",
	"recovered": "4"
}, ...
]
```

**Curl:**
```sh
curl -X GET "https://endpoint.ainize.ai/laeyoung/wuhan-coronavirus-api/jhu-edu/latest" -H "accept: application/json"
```

**Browser:**
https://endpoint.ainize.ai/laeyoung/wuhan-coronavirus-api/jhu-edu/latest

### Original data source
[Novel Coronavirus (2019-nCoV) Cases](https://docs.google.com/spreadsheets/d/1yZv9w9zRKwrGTaR-YzmAqMefw4wMlaXocejdxZaTs6w), provided by JHU CSSE
