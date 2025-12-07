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
	City     string `json:"city"`
	Location struct {
		Lat string `json:"lat"`
		Lon string `json:"lon"`
	} `json:"location"`
	Temperature   float64 `json:"temperature"`
	FeelsLike     float64 `json:"feelsLike"`
	Humidity      float64 `json:"humidity"`
	WindSpeed     float64 `json:"windSpeed"`
	ConditionCode int     `json:"conditionCode"`
	IsDay         int     `json:"isDay"`
	Timestamp     string  `json:"timestamp"`
}

func main() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	apiURL := os.Getenv("API_URL")

	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}

	log.Println("🚀 Worker Go Iniciado...")

	var conn *amqp.Connection
	var err error
	for {
		conn, err = amqp.Dial(rabbitURL)
		if err == nil {
			log.Println("✅ Conectado ao RabbitMQ!")
			break
		}
		time.Sleep(5 * time.Second)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Erro channel")
	defer ch.Close()

	q, err := ch.QueueDeclare("weather_queue", true, false, false, false, nil)
	failOnError(err, "Erro queue")

	msgs, err := ch.Consume(q.Name, "", false, false, false, false, nil)
	failOnError(err, "Erro consume")

	forever := make(chan struct{})

	go func() {
		for d := range msgs {
			var data WeatherData
			err := json.Unmarshal(d.Body, &data)
			if err != nil {
				log.Printf("❌ JSON Inválido: %s", err)
				d.Nack(false, false)
				continue
			}

			if err := sendToAPI(apiURL, data); err != nil {
				log.Printf("⚠️ Erro API: %s", err)
			} else {
				log.Println("✅ Salvo via API")
			}
			d.Ack(false)
		}
	}()

	<-forever
}

func sendToAPI(url string, data WeatherData) error {
	jsonData, err := json.Marshal(data)
	if err != nil { return err }

	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil { return err }
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return log.Output(1, "Status erro da API")
	}
	return nil
}

func failOnError(err error, msg string) {
	if err != nil { log.Fatalf("%s: %s", msg, err) }
}