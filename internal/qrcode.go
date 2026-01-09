package internal

import (
	"bytes"
	"encoding/json"
	"io"

	"github.com/yeqown/go-qrcode/v2"
	"github.com/yeqown/go-qrcode/writer/standard"
)

type VehicleTypeEnum string

const (
	VehicleTypeCar      = "CAR"
	VehicleTypeBike     = "BIKE"
	VehicleTypeRickshaw = "Rickshaw"
)

type VehicleQRCodeData struct {
	Type        string          `json:"type"`
	TicketID    string          `json:"ticket_id"`
	Vehicle     string          `json:"vehicle"`
	ParkingLot  string          `json:"parking_lot"`
	VehicleType VehicleTypeEnum `json:"vehicle_type"`
}

type UserQRCodeData struct {
	Type        string          `json:"type"`
	Vehicle     string          `json:"vehicle"`
	VehicleType VehicleTypeEnum `json:"vehicle_type"`
	Username    string          `json:"username"`
}

type nopWriteCloser struct {
	io.Writer
}

func (nopWriteCloser) Close() error { return nil }

func QRCode(data VehicleQRCodeData) ([]byte, error) {
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	qr, err := qrcode.New(string(jsonBytes))
	if err != nil {
		return nil, err
	}

	buf := &bytes.Buffer{}

	options := []standard.ImageOption{
		standard.WithLogoImageFilePNG("./internal/assets/car.png"),
	}

	writer := standard.NewWithWriter(
		nopWriteCloser{buf},
		options...,
	)

	defer writer.Close()

	if err := qr.Save(writer); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func QRCodeUser(data UserQRCodeData) ([]byte, error) {
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	qr, err := qrcode.New(string(jsonBytes))
	if err != nil {
		return nil, err
	}

	buf := &bytes.Buffer{}

	options := []standard.ImageOption{
		standard.WithLogoImageFilePNG("./internal/assets/car.png"),
	}

	writer := standard.NewWithWriter(
		nopWriteCloser{buf},
		options...,
	)

	defer writer.Close()

	if err := qr.Save(writer); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}
