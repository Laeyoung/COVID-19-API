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
	"lastupdate": "2/2/2020 23:43",
	"confirmed": "11177",
	"deaths": "350",
	"recovered": "295",
	"location": {
		"lat": 32.52,
		"lng": 111.5
	}
}, {
	"provincestate": "Zhejiang",
	"countryregion": "Mainland China",
	"lastupdate": "2/3/2020 1:33",
	"confirmed": "724",
	"deaths": "0",
	"recovered": "36",
	"location": {
		"lat": 28.4504,
		"lng": 119.9
	}
}, ...
]
```

**Curl:**
```sh
curl -X GET "https://endpoint.ainize.ai/laeyoung/wuhan-coronavirus-api/jhu-edu/latest" -H "accept: application/json"
```

**Browser:**
https://endpoint.ainize.ai/laeyoung/wuhan-coronavirus-api/jhu-edu/latest

### Services using Wuhan-Coronavirus-API
- https://corona-three.now.sh/

### Original data source
[Novel Coronavirus (2019-nCoV) Cases](https://docs.google.com/spreadsheets/d/1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM), provided by JHU CSSE
