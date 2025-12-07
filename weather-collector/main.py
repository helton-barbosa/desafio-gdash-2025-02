import time
import json
import os
import requests
import pika
import schedule
import logging
import sys
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

RABBIT_HOST = os.getenv('RABBITMQ_HOST', 'rabbitmq')
RABBIT_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBIT_PASS = os.getenv('RABBITMQ_PASS', 'guest')
QUEUE_NAME = 'weather_queue'

LATITUDE = '-10.1689'
LONGITUDE = '-48.3317'
CITY_NAME = 'Palmas - TO'

API_URL = f"https://api.open-meteo.com/v1/forecast?latitude={LATITUDE}&longitude={LONGITUDE}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature,is_day&timezone=America%2FAraguaina"

def get_rabbitmq_connection():
    credentials = pika.PlainCredentials(RABBIT_USER, RABBIT_PASS)
    parameters = pika.ConnectionParameters(host=RABBIT_HOST, credentials=credentials)
    while True:
        try:
            return pika.BlockingConnection(parameters)
        except pika.exceptions.AMQPConnectionError:
            logger.warning("⏳ RabbitMQ indisponível. Tentando reconexão em 5s...")
            time.sleep(5)

def fetch_and_publish():
    logger.info(f"🔄 Iniciando coleta de dados para: {CITY_NAME}")
    try:
        start_time = time.time()
        response = requests.get(API_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        current = data.get('current', {})

        payload = {
            "city": CITY_NAME,
            "location": {"lat": LATITUDE, "lon": LONGITUDE},
            "temperature": current.get('temperature_2m'),
            "feelsLike": current.get('apparent_temperature'),
            "humidity": current.get('relative_humidity_2m'),
            "windSpeed": current.get('wind_speed_10m'),
            "conditionCode": current.get('weather_code'),
            "isDay": current.get('is_day'),
            "timestamp": datetime.now().isoformat()
        }

        connection = get_rabbitmq_connection()
        channel = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME, durable=True)
        channel.basic_publish(
            exchange='',
            routing_key=QUEUE_NAME,
            body=json.dumps(payload),
            properties=pika.BasicProperties(delivery_mode=2)
        )

        duration = time.time() - start_time
        logger.info(f"✅ Sucesso: {CITY_NAME} | Temp: {payload['temperature']}°C | Tempo: {duration:.2f}s")
        connection.close()

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Erro de conexão com API externa: {e}")
    except Exception as e:
        logger.error(f"❌ Erro crítico no coletor: {e}", exc_info=True)

if __name__ == "__main__":
    logger.info("🚀 Serviço Weather Collector Iniciado com Logs Detalhados")
    fetch_and_publish()
    schedule.every(1).minutes.do(fetch_and_publish)
    while True:
        schedule.run_pending()
        time.sleep(1)
