import axios from 'axios';

// --- M-PESA CONFIGURATION ---
// --- M-PESA CONFIGURATION ---
// IMPORTANT: Replace these with your actual credentials and ensure they are secure
const CONSUMER_KEY = "9GeIpoG9Y3gzgIBcZKOoEb2tZ1gR3WNRvOceJpBNS8GxHbSF";
const CONSUMER_SECRET = "4gSRIXkBGtdgyw8bmkuGezDeAgxxp5qntWz1nRYQZUsv2SplZbGAwaa8qrNGeVjy";
const SHORT_CODE = "4645881"; // Paybill or Till Number (Sandbox: 174379)
const PASSKEY = "a800c3ca85746ef882676f6b422788fb469f3a79606e297b462ec91b7f26d827"; // STK Push Passkey
const BIZ_TYPE = "CustomerBuyGoodsOnline"; // "CustomerBuyGoodsOnline" for Tills
const CALLBACK_URL = "https://pseudocentric-greathearted-roberto.ngrok-free.dev/api/mpesa_callback"; // ✅ Correct
const MPESA_BASE_URL = "https://api.safaricom.co.ke";



// --- Utility Functions ---

/**
 * Formats a phone number to the 2547... format.
 * @param {string} phone
 * @returns {string | null}
 */
const formatPhoneNumber = (phone) => {
    const trimmedPhone = String(phone).trim();
    if (/^0\d{9}$/.test(trimmedPhone)) { // 07...
        return "254" + trimmedPhone.substring(1);
    } else if (/^\+254\d{9}$/.test(trimmedPhone)) { // +2547...
        return trimmedPhone.substring(1);
    } else if (/^254\d{9}$/.test(trimmedPhone)) { // 2547...
        return trimmedPhone;
    }
    return null;
};

/**
 * Gets the M-Pesa Access Token.
 * @param {string} consumerKey
 * @param {string} consumerSecret
 * @returns {Promise<string | null>}
 */
const getMpesaAccessToken = async (consumerKey, consumerSecret) => {
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const url = `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Basic ${credentials}`,
            },
        });
        return response.data.access_token || null;
    } catch (error) {
        console.error("Access Token Error:", error.response?.data || error.message);
        return null;
    }
};


/**
 * Sends the STK Push request.
 * @param {object} data
 * @param {string} accessToken
 * @returns {Promise<object>}
 */
const sendStkPush = async (data, accessToken) => {
    const url = `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`;

    try {
        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error("STK Push Error:", error.response?.data || error.message);
        return { error: 'STK Push failed', details: error.response?.data || error.message };
    }
};

// --- Next.js API Handler (POST) ---

/**
 * Handles the M-Pesa STK Push request.
 */
export async function POST(request) {
    try {
        const { phoneNumber, total } = await request.json();

        const totalPrice = parseInt(total, 10);
        const phone = formatPhoneNumber(phoneNumber);

        // 1. Validate Input
        if (!phone || isNaN(totalPrice) || totalPrice <= 0) {
            return Response.json(
                {
                    message: `Invalid phone number or amount. ${phoneNumber} ${totalPrice}`,
                },
                { status: 400 }
            );
        }

        console.log("====================================");
        console.log("M-PESA REQUEST STARTED");
        console.log("Phone:", phone);
        console.log("Amount:", totalPrice);
        console.log("====================================");

        // 2. Get Access Token
        const accessToken = await getMpesaAccessToken(
            CONSUMER_KEY,
            CONSUMER_SECRET
        );

        console.log("ACCESS TOKEN:", accessToken ? "SUCCESS" : "FAILED");

        if (!accessToken) {
            return Response.json(
                { message: "Failed to obtain access token." },
                { status: 500 }
            );
        }

        // 3. Generate Timestamp
        const now = new Date();

        const timestamp =
            now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0") +
            String(now.getHours()).padStart(2, "0") +
            String(now.getMinutes()).padStart(2, "0") +
            String(now.getSeconds()).padStart(2, "0");

        const password = Buffer.from(
            `${SHORT_CODE}${PASSKEY}${timestamp}`
        ).toString("base64");

        // 4. Build Request
        const requestData = {
            BusinessShortCode: SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: BIZ_TYPE,
            Amount: totalPrice,
            PartyA: phone,
            PartyB: SHORT_CODE,
            PhoneNumber: phone,
            CallBackURL: CALLBACK_URL,
            AccountReference: "9031853",
            TransactionDesc: "Payment for services",
        };

        console.log("REQUEST DATA:");
        console.log(JSON.stringify(requestData, null, 2));

        // 5. Send STK Push
        const stkResponse = await sendStkPush(
            requestData,
            accessToken
        );

        console.log("========== STK RESPONSE ==========");
        console.log(JSON.stringify(stkResponse, null, 2));
        console.log("==================================");

        // 6. Return Response
        if (stkResponse.ResponseCode === "0") {
            return Response.json(
                {
                    message: "STK Push initiated successfully!",
                    response: stkResponse,
                },
                { status: 200 }
            );
        }

        return Response.json(
            {
                message: "STK Push failed to initiate.",
                response: stkResponse,
            },
            { status: 500 }
        );
    } catch (error) {
        console.error("M-PESA ERROR:", error);

        return Response.json(
            {
                message: "Internal server error",
                error: error.message,
            },
            { status: 500 }
        );
    }
}