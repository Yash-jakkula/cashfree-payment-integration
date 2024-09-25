const { headers } = require("./supabaseProvider");
const { Cashfree } = require("cashfree-pg");
// --url https://api.cashfree.com/pg/orders \
// --header 'accept: application/json' \
// --header 'content-type: application/json' \
// --header 'x-api-version: 2023-08-01' \
// --header 'x-client-id: ' \
// --header 'x-client-secret: ' \
// --data '

//creates an order with the order amount and currency type returns a session id which is used for transaction.

Cashfree.x_client_id = process.env.x_client_id;
Cashfree.x_secret_key = process.env.x_secret_key;
Cashfree.Environment = Cashfree.Environment.SANDBOX;

exports.createSdkOrder = async (req, res, next) => {
  try {
    var request = {
      order_amount: 1,
      order_currency: "INR",
      order_id: "order_34692745",
      customer_details: {
        customer_id: "walterwNrcMi",
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url:
          "https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id={order_id}",
      },
    };
    const result = await Cashfree.PGCreateOrder("2022-09-01", request);
    console.log(await result.json());
  } catch (err) {
    console.error(err);
  }
};
exports.createOrder = async (req, res, next) => {
  try {
    const {
      customer_id,
      customer_email,
      customer_name,
      customer_phone,
      order_id,
    } = req.body;
    const data = {
      customer_details: {
        customer_id: customer_id,
        customer_email: customer_email,
        customer_phone: `+91${customer_phone}`,
        customer_name: customer_name,
      },
      order_id: `${order_id}`,
      order_amount: 10.15,
      order_currency: "INR",
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": `${process.env.test_x_client_id}`,
        "x-client-secret": `${process.env.test_x_secret_key}`,
      },
      body: JSON.stringify(data),
    };
    const result = await fetch(`${process.env.test_cashfree_url}`, options);
    const order_details = await result.json();
    if (result.status === 409) {
      const getorder_det = await getOrder(order_id);
      console.log(getorder_det);
      if (getorder_det[0]?.payment_status) {
        return res.status(200).json({
          status: getorder_det[0].payment_status,
          error: getorder_det[0].error_details,
        });
      }
      const transaction_info = await payOrder(getorder_det.payment_session_id);
      return res.status(result.status).json(transaction_info);
    }
    const transaction_info = await payOrder(order_details.payment_session_id);
    return res.status(result.status).json(transaction_info);
  } catch (err) {
    console.log(err);
  }
};

const payOrder = async (payment_id) => {
  const data = {
    payment_method: {
      upi: {
        channel: "link",
        upi_id: "testsuccess@gocash",
      },
    },
    payment_session_id: `${payment_id}`,
  };
  // prod https://api.cashfree.com/pg/orders/sessions
  // test https://sandbox.cashfree.com/pg/orders/sessions
  const transaction_result = await fetch(
    "https://sandbox.cashfree.com/pg/orders/sessions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(data),
    }
  );
  return await transaction_result.json();
};

const getOrder = async (order_id) => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": `${process.env.test_x_client_id}`,
      "x-client-secret": `${process.env.test_x_secret_key}`,
    },
  };
  const order_detials = await fetch(
    `${process.env.test_cashfree_url}/${order_id}/payments`,
    options
  );
  return await order_detials.json();
};

const getPayment = async (order_id, cf_payment_id) => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": `${process.env.test_x_client_id}`,
      "x-client-secret": `${process.env.test_x_secret_key}`,
    },
  };
  const order_detials = await fetch(
    `${process.env.test_cashfree_url}/${order_id}/payments/${cf_payment_id}`,
    options
  );
  return await order_detials.json();
};
