export interface ParkingLot {
    _id? : string , 
    name : string, 
    location :  string,
    capacity: number
    lng: number,
    lat: number
    hasEVCharger: boolean
    occupied: number
}