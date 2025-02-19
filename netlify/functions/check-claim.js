const faunadb = require('faunadb'); // Si tu utilises FaunaDB

// Remplace par tes informations de connexion à FaunaDB
const client = new faunadb.Client({
  secret: 'dbsecret',
});

const q = faunadb.query;

exports.handler = async (event, context) => {
  try {
    const ip = event.headers['x-forwarded-for'] || event.headers['x-real-ip']; // Récupère l'IP via les headers
    if (!ip) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'IP address not found' }),
      };
    }

    // Recherche dans FaunaDB si l'IP a déjà fait un claim dans les dernières 12 heures
    const response = await client.query(
      q.Get(q.Match(q.Index('claims_by_ip'), ip))
    );

    // Si l'IP n'a pas encore réclamé, créer un claim pour cet utilisateur
    if (response) {
      const lastClaimTime = response.data.timestamp; // L'heure du dernier claim
      const currentTime = new Date().getTime();
      const twelveHoursInMilliseconds = 12 * 60 * 60 * 1000;

      if (currentTime - lastClaimTime < twelveHoursInMilliseconds) {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'You have already claimed in the last 12 hours.' }),
        };
      }
    }

    // Si l'utilisateur peut réclamer, on lui permet et on met à jour la base de données
    await client.query(
      q.Create(q.Collection('claims'), {
        data: {
          ip: ip,
          timestamp: new Date().getTime(),
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
