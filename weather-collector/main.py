import time
import json
import os
import requests
import pika
import schedule
from datetime import datetime

RABBIT_HOST = os.getenv('RABBITMQ_HOST', 'rabbitmq')
RABBIT_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBIT_PASS = os.getenv('RABBITMQ_PASS', 'guest')
QUEUE_NAME = 'weather_queue'

LATITUDE = '-10.2108'
LONGITUDE = '-48.1807'
API_URL = f"https://api.open-meteo.com/v1/forecast?latitude={LATITUDE}&longitude={LONGITUDE}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America%2FSao_Paulo"

def get_rabbitmq_connection():
    """Tenta conectar ao RabbitMQ com retries (reconexão automática)."""
    credentials = pika.PlainCredentials(RABBIT_USER, RABBIT_PASS)
    parameters = pika.ConnectionParameters(host=RABBIT_HOST, credentials=credentials)

    while True:
        try:
            connection = pika.BlockingConnection(parameters)
            return connection
        except pika.exceptions.AMQPConnectionError:
            print("⏳ RabbitMQ indisponível. Tentando novamente em 5s...")
            time.sleep(5)

def fetch_and_publish():
    """Busca dados do clima e publica na fila."""
    print(f"🔄 Buscando dados de clima para Lat: {LATITUDE}, Long: {LONGITUDE}...")

    try:
        response = requests.get(API_URL)
        response.raise_for_status()
        data = response.json()
        current = data.get('current', {})
        payload = {
            "location": {"lat": LATITUDE, "lon": LONGITUDE},
            "temperature": current.get('temperature_2m'),
            "humidity": current.get('relative_humidity_2m'),
            "wind_speed": current.get('wind_speed_10m'),
            "condition_code": current.get('weather_code'),
            "timestamp": datetime.now().isoformat()
        }

        connection = get_rabbitmq_connection()
        channel = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME, durable=True)
        channel.basic_publish(
            exchange='',
            routing_key=QUEUE_NAME,
            body=json.dumps(payload),
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )

        print(f"✅ Dados enviados para fila '{QUEUE_NAME}': {payload['temperature']}°C")
        connection.close()

    except Exception as e:
        print(f"❌ Erro ao processar: {e}")

if __name__ == "__main__":
    print("🚀 Serviço Weather Collector iniciado")
    fetch_and_publish()
    schedule.every(1).minutes.do(fetch_and_publish)
    while True:
        schedule.run_pending()
        time.sleep(1)
