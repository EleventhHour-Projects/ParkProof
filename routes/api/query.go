package api

import (
	"app/internal/database"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type QueryRrquest struct {
	Query            string    `json:"query"`
	ToParkingLot     string    `json:"to_parking_lot"`
	ResponseRequired bool      `json:"response_required"`
	Time             time.Time `json:"time"`
	WithInTime       int       `json:"with_in_time"`
	Type             string    `json:"type"`
}

func SendQuery(c *fiber.Ctx) error {
	var data QueryRrquest
	c.BodyParser(&data)

	q := database.Query{
		Query:            data.Query,
		ToParkingLot:     data.ToParkingLot,
		ResponseRequired: data.ResponseRequired,
		Time:             data.Time,
		WithInTime:       data.WithInTime,
		Status:           database.QueryStatusOpen,
		Type:             data.Type,
		ID:               "query" + uuid.New().String(),
	}
	err := database.AddQuery(q)
	if err != nil {
		c.Status(400)
		return c.JSON(map[string]string{"error": err.Error()})
	}

	c.Status(200)
	return c.JSON(map[string]string{"status": "done"})
}
