
export const logTamperData = async (data: {
    vehicleNo: string;
    vehicleType: string;
    parkingLotId: string;
    action: "ENTRY" | "EXIT";
}) => {
    try {
        await fetch("https://parkproof.onrender.com/api/tamper-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("Failed to log tamper data", error);
    }
};
