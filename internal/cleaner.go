package internal

import (
	"app/internal/database"
	"log"
	"time"
)

func Cleaner() {
	log.Println("Cleaner started")
	for {
		tickets, err := database.GetAllTickets()
		if err != nil {
			log.Fatal(err)
		}
		var ticketsToExpire []database.Ticket
		for _, ticket := range tickets {
			if ticket.ValidTill.Before(time.Now()) {
				ticketsToExpire = append(ticketsToExpire, ticket)
			}
		}
		for _, ticket := range ticketsToExpire {
			ticket.Status = "EXPIRED"
			err = database.UpdateTicket(ticket)
			if err != nil {
				log.Fatal(err)
			}
		}
		time.Sleep(5 * time.Minute) // CooooolDown time
	}
}
