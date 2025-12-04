package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type WeatherData struct {
	Location struct {
		Lat string `json:"lat"`
		Lon string `json:"lon"`
	} `json:"location"`
	Temperature   float64 `json:"temperature"`
	Humidity      float64 `json:"humidity"`
	WindSpeed     float64 `json:"wind_speed"`
	ConditionCode int     `json:"condition_code"`
	Timestamp     string  `json:"timestamp"`
}

func main() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	apiURL := os.Getenv("API_URL")

	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}

	log.Println("🚀 Iniciando Worker Go...")

	var conn *amqp.Connection
	var err error
	for {
		conn, err = amqp.Dial(rabbitURL)
		if err == nil {
			log.Println("✅ Conectado ao RabbitMQ!")
			break
		}
		log.Printf("⏳ Aguardando RabbitMQ... (%s)", err)
		time.Sleep(5 * time.Second)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Falha ao abrir canal")
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"weather_queue",
		true,
		false,
		false,
		false,
		nil,
	)
	failOnError(err, "Falha ao declarar fila")

	msgs, err := ch.Consume(
		q.Name,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	failOnError(err, "Falha ao registrar consumidor")

	log.Println("🎧 Aguardando mensagens na fila 'weather_queue'...")

	forever := make(chan struct{})

	go func() {
		for d := range msgs {
			log.Printf("📩 Processando mensagem...")

			var data WeatherData
			err := json.Unmarshal(d.Body, &data)
			if err != nil {
				log.Printf("❌ JSON Inválido: %s", err)
				d.Nack(false, false) // Rejeita
				continue
			}

			// Envia para API
			err = sendToAPI(apiURL, data)
			if err != nil {
				log.Printf("⚠️ Falha ao enviar para API: %s", err)
			} else {
				log.Println("✅ Sucesso: Dados persitidos via API")
			}

			d.Ack(false)
		}
	}()

	<-forever
}

func sendToAPI(url string, data WeatherData) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return log.Output(1, "API retornou erro")
	}
	return nil
}

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}