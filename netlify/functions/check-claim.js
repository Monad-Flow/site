const faunadb = require('faunadb');

const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});

const q = faunadb.query;

exports.handler = async (event, context) => {
  try {
    const ip = event.headers['x-forwarded-for'] || event.headers['x-real-ip'];
    if (!ip) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'IP address not found' }),
      };
    }

    let response;
    try {
      response = await client.query(
        q.Get(q.Match(q.Index('claims_by_ip'), ip))
      );
    } catch (error) {
      if (error.message.includes("instance not found")) {

        response = null;
      } else {
        throw error;
      }
    }

    const currentTime = new Date().getTime();
    const twelveHoursInMilliseconds = 12 * 60 * 60 * 1000;

    if (response) {
      const lastClaimTime = response.data.timestamp;
      if (currentTime - lastClaimTime < twelveHoursInMilliseconds) {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'You have already claimed in the last 12 hours.' }),
        };
      }
    }

    await client.query(
      q.Create(q.Collection('claims'), {
        data: {
          ip: ip,
          timestamp: currentTime,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Claim successful!' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};
