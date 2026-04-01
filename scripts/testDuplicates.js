async function testDuplicate() {
    const formId = 6;
    const url = `http://localhost:3000/api/orderform/${formId}/entries`;
    
    const payload = {
        eventId: 2,
        userEmail: "karyllebernate8@gmail.com", // This exists in registrations for event 2
        formData: {
            sections: [
                {
                    inputs: [
                        { id: "1", fieldIdentifier: "email", answer: "karyllebernate8@gmail.com" },
                        { id: "2", fieldIdentifier: "first_name", answer: "Duplicate" },
                        { id: "3", fieldIdentifier: "last_name", answer: "Test" }
                    ]
                }
            ]
        }
    };

    console.log("Testing duplicate registration for karyllebernate8@gmail.com...");
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("Response Status:", response.status);
        console.log("Response Body:", JSON.stringify(result, null, 2));

        if (response.status === 400 && result.error.includes("already registered")) {
            console.log("✅ Success: Duplicate registration correctly blocked.");
        } else {
            console.log("❌ Failure: Duplicate registration was not blocked as expected.");
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testDuplicate();
