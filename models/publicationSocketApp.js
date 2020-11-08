var fs = require('fs');
const debug = require('debug')('millegrilles:publication:publicationSocketApp')

function configurationEvenements(socket) {
  const configurationEvenements = {
    listenersPrives: [
      {eventName: 'publication/requeteSites', callback: (params, cb) => {requeteSites(socket, params, cb)}},
      {eventName: 'publication/requeteSite', callback: (params, cb) => {requeteSite(socket, params, cb)}},
      {eventName: 'publication/requeteNoeuds', callback: (params, cb) => {requeteNoeuds(socket, params, cb)}},
    ],
    listenersProteges: [
      {eventName: 'publication/majSite', callback: (transaction, cb) => {
        soumettreTransaction(socket, transaction, 'Publication.majSite', cb)
      }},
      {eventName: 'publication/majPost', callback: (transaction, cb) => {
        soumettreTransaction(socket, transaction, 'Publication.majPost', cb)
      }},
    ]
  }

  return configurationEvenements
}

// async function majSite(socket, transaction, cb) {
//   // Ajout d'un nouveau site
//   console.debug("Recu majSite : %O", transaction)
//   try {
//     if(transaction['en-tete'].domaine === 'Publication.majSite') {
//       const amqpdao = socket.amqpdao
//       const reponse = await amqpdao.transmettreEnveloppeTransaction(transaction)
//       return cb(reponse)
//     } else {
//       return cb({err: 'Mauvais domaine pour majSite : ' + transaction.domaine})
//     }
//   } catch(err) {
//     console.error("majSite %O", err)
//     return cb({err: ''+err})
//   }
// }
//
// async function majPost(socket, transaction, cb) {
//   // Ajout d'un nouveau site
//   console.debug("Recu majPost : %O", transaction)
//   try {
//     if(transaction['en-tete'].domaine === 'Publication.majPost') {
//       const amqpdao = socket.amqpdao
//       const reponse = await amqpdao.transmettreEnveloppeTransaction(transaction)
//       return cb(reponse)
//     } else {
//       return cb({err: 'Mauvais domaine pour majPost : ' + transaction.domaine})
//     }
//   } catch(err) {
//     console.error("majPost %O", err)
//     return cb({err: ''+err})
//   }
// }

// function traiterCommande(rabbitMQ, enveloppe, cb) {
//   // console.debug("Enveloppe de commande recue");
//   // console.debug(enveloppe);
//   let routingKey = enveloppe.routingKey;
//   let commande = enveloppe.commande;
//   let nowait = !cb;
//
//   let params = {nowait}
//   if(enveloppe.exchange) params.exchange = enveloppe.exchange
//
//   rabbitMQ.transmettreCommande(routingKey, commande, params)
//     .then( reponse => {
//       if(reponse) {
//         if(cb) {
//           cb(reponse.resultats || reponse); // On transmet juste les resultats
//         }
//       } else {
//         if(!nowait) {
//           console.error("Erreur reception reponse commande " + routingKey);
//         }
//       }
//     })
//     .catch( err => {
//       console.error("Erreur commande");
//       console.error(err);
//       if(cb) {
//         cb(); // Callback sans valeurs
//       }
//     });
// }

function requeteSites(socket, params, cb) {
  executerRequete('Publication.listeSites', socket, params, cb)
}

function requeteSite(socket, params, cb) {
  executerRequete('Publication.configurationSite', socket, params, cb)
}

function requeteNoeuds(socket, params, cb) {
  executerRequete('Topologie.listeNoeuds', socket, params, cb)
}

async function executerRequete(domaineAction, socket, params, cb) {
  const amqpdao = socket.amqpdao
  try {
    const reponse = await amqpdao.transmettreRequete(domaineAction, params, {decoder: true})
    cb(reponse)
  } catch(err) {
    debug("Erreur executerRequete\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function soumettreTransaction(socket, transaction, domaineValide, cb) {
  // Verifie le domaine d'une transaction et la transmet a MQ
  console.debug("Recu %s : %O", domaineValide, transaction)
  try {
    if(transaction['en-tete'].domaine === domaineValide) {
      const amqpdao = socket.amqpdao
      const reponse = await amqpdao.transmettreEnveloppeTransaction(transaction)
      return cb(reponse)
    } else {
      return cb({err: 'Mauvais domaine pour ' + domaineValide + ' : ' + transaction.domaine})
    }
  } catch(err) {
    console.error("%s %O", domaineValide, err)
    return cb({err: ''+err})
  }
}

module.exports = {configurationEvenements};
