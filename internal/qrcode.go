package internal

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/yeqown/go-qrcode/v2"
	"github.com/yeqown/go-qrcode/writer/standard"
)

type VehicleTypeEnum string

const (
	VehicleTypeCar      = "Car"
	VehicleTypeBike     = "Bike"
	VehicleTypeRickshaw = "Rickshaw"
)

type VehicleQRCodeData struct {
	TicketID    string          `json:"ticket_id"`
	Vehicle     string          `json:"vehicle"`
	EntryTime   time.Time       `json:"entryTime"`
	ParkingLot  string          `json:"parking_lot"`
	IsExit      bool            `json:"is_exit"`
	VehicleType VehicleTypeEnum `json:"vehicle_type"`
}

func QRCode(data VehicleQRCodeData) {

	jsonBytes, err := json.Marshal(data)
	if err != nil {
		panic(err)
	}
	qr, err := qrcode.New(string(jsonBytes))
	if err != nil {
		fmt.Printf("create qrcode failed: %v\n", err)
		return
	}

	options := []standard.ImageOption{
		standard.WithLogoImageFilePNG("./internal/assets/car.png"),
	}
	writer, err := standard.New("./qrcode_with_logo.png", options...)
	if err != nil {
		fmt.Printf("create writer failed: %v\n", err)
		return
	}

	defer writer.Close()
	if err = qr.Save(writer); err != nil {
		fmt.Printf("save qrcode failed: %v\n", err)
	}
}
