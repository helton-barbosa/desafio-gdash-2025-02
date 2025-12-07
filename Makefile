setup:
	cp .env.example .env

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

test-api:
	docker run --rm -v "$(PWD)/core-api":/app -w /app node:20-alpine sh -c "npm install && npm test"

clean:
	docker compose down -v
	rm -rf core-api/dist core-api/node_modules web-dashboard/dist web-dashboard/node_modules
