import CryptoJS from 'crypto-js';
import moment from 'moment';
import axios from 'axios';
import pool from '../config/connectDB.js';
import QueryString from 'qs';
import 'dotenv/config';

const config = {
    app_id: process.env.ZALOPAY_CONFIG_APP_ID,
    key1: process.env.ZALOPAY_CONFIG_KEY1,
    key2: process.env.ZALOPAY_CONFIG_KEY2,
    endpoint: process.env.ZALOPAY_CREATE_ENDPOINT,
};

export const payment = async (req, res) => {
    const embed_data = {
        //sau khi hoàn tất thanh toán sẽ đi vào link này (thường là link web thanh toán thành công của mình)
        redirecturl: '',
        attachData: {
            id: req.body.data.id,
            name: req.body.data.name,
            phone: req.body.data.phone,
            email: req.body.data.email,
        },
    };

    console.log('body', req.body.data);

    const items = JSON.parse(req.body.data.list); // danh sách vé tàu gửi lên

    const order = {
        app_id: config.app_id,
        app_trans_id: req.body.data.trans_id, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
        app_user: req.body.data.name + ' ' + req.body.data.id,
        app_time: Date.now(), // miliseconds
        item: JSON.stringify(items),
        embed_data: JSON.stringify(embed_data),
        amount: req.body.data.amount,
        //khi thanh toán xong, zalopay server sẽ POST đến url này để thông báo cho server của mình
        //Chú ý: cần dùng ngrok để public url thì Zalopay Server mới call đến được
        callback_url: process.env.NGROK_ENDPOINT + '/api/v2/zalopay/callback',
        description: `Tickets - Payment for the order #${req.body.data.trans_id}`,
        bank_code: '', // để trống thì có thể thanh toán qua nhiều phương thức khác như visa hoặc ngân hàng
    };

    // appid|app_trans_id|appuser|amount|apptime|embeddata|item
    const data =
        config.app_id +
        '|' +
        order.app_trans_id +
        '|' +
        order.app_user +
        '|' +
        order.amount +
        '|' +
        order.app_time +
        '|' +
        order.embed_data +
        '|' +
        order.item;

    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    try {
        console.log(order);

        const result = await axios.post(config.endpoint, null, { params: order });

        return res.status(200).json(result.data);
    } catch (error) {
        console.log(error);
    }
};

export const callback = async (req, res) => {
    let result = {};
    console.log('callback ');
    try {
        let dataStr = req.body.data;
        let reqMac = req.body.mac;

        let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
        // console.log('mac =', mac);

        // kiểm tra callback hợp lệ (đến từ ZaloPay server)
        if (reqMac !== mac) {
            // callback không hợp lệ
            result.return_code = -1;
            result.return_message = 'mac not equal';
        } else {
            // thanh toán thành công
            // merchant cập nhật trạng thái cho đơn hàng ở đây
            let dataJson = JSON.parse(dataStr, config.key2);
            // console.log("update order's status = success where app_trans_id =", dataJson['app_trans_id']);
            console.log(dataJson);
            const { attachData } = JSON.parse(dataJson['embed_data']);

            JSON.parse(dataJson['item']).forEach(async (item) => {
                console.log(`INSERT INTO bookedticket (ID, ArriveStation, DepartStation, TrainID, Arrive, Depart, Position, Coach, BookingDate, cus_email, cus_id, cus_phone, cus_name)
                VALUES (UUID(), '${item.toStation}', '${item.fromStation}', '${item.train}', '${item.arrival}', '${item.depart}', ${item.seat}, ${item.coach}, '${item.bookingDate}', '${attachData.email}', '${attachData.id}', '${attachData.phone}', '${attachData.name}');`);
                const [rows, fields] =
                    await pool.execute(`INSERT INTO bookedticket (ID, ArriveStation, DepartStation, TrainID, Arrive, Depart, Position, Coach, BookingDate, cus_email, cus_id, cus_phone, cus_name)
                VALUES ('${item.id}', '${item.toStation}', '${item.fromStation}', '${item.train}', '${item.arrival}', '${item.depart}', ${item.seat}, ${item.coach}, '${item.bookingDate}', '${attachData.email}', '${attachData.id}', '${attachData.phone}', '${attachData.name}');`);

                console.log(rows);
            });

            result.return_code = 1;
            result.return_message = 'success';
        }
    } catch (ex) {
        console.log('lỗi:::' + ex.message);
        result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
        result.return_message = ex.message;
    }

    // thông báo kết quả cho ZaloPay server
    res.json(result);
};

export const checkOrderStatus = async (req, res) => {
    console.log('check order', req.body);
    const { app_trans_id } = req.body;
    console.log('app_trans_id', app_trans_id);

    let postData = {
        app_id: process.env.ZALOPAY_CONFIG_APP_ID,
        app_trans_id, // Input your app_trans_id
    };

    let data = postData.app_id + '|' + postData.app_trans_id + '|' + config.key1; // appid|app_trans_id|key1
    postData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    let postConfig = {
        method: 'post',
        url: process.env.ZALOPAY_QUERY_ENDPOINT,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: QueryString.stringify(postData),
    };

    try {
        const result = await axios(postConfig);
        console.log(result.data);
        return res.status(200).json(result.data);
        /**
     * kết quả mẫu
      {
        "return_code": 1, // 1 : Thành công, 2 : Thất bại, 3 : Đơn hàng chưa thanh toán hoặc giao dịch đang xử lý
        "return_message": "",
        "sub_return_code": 1,
        "sub_return_message": "",
        "is_processing": false,
        "amount": 50000,
        "zp_trans_id": 240331000000175,
        "server_time": 1711857138483,
        "discount_amount": 0
      }
    */
    } catch (error) {
        console.log('lỗi');
        console.log(error);
    }
};
