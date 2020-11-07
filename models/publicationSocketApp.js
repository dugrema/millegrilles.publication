var fs = require('fs');
const debug = require('debug')('millegrilles:publication:publicationSocketApp')

function configurationEvenements(socket) {
  const configurationEvenements = {
    listenersPrives: [
      {eventName: 'publication/requeteSites', callback: (params, cb) => {requeteSites(socket, params, cb)}},
    ],
    listenersProteges: [
      // {eventName: 'coupdoeil/ajouterCatalogueApplication', callback: (transaction, cb) => {
      //   ajouterCatalogueApplication(socket, transaction, cb)
      // }},
    ]
  }

  return configurationEvenements
}

// async function ajouterCatalogueApplication(socket, transaction, cb) {
//   // Ajout d'un catalogue d'application avec transaction preformattee
//   console.debug("Recu ajouterCatalogueApplication : %O", transaction)
//   try {
//     if(transaction['en-tete'].domaine === 'CatalogueApplications.catalogueApplication') {
//       const amqpdao = socket.amqpdao
//       const reponse = await amqpdao.transmettreEnveloppeTransaction(transaction)
//       return cb(reponse)
//     } else {
//       // Par defaut
//       cb({err: 'Mauvais domaine pour ajouterCatalogueApplication : ' + transaction.domaine})
//     }
//   } catch(err) {
//     console.error("ajouterCatalogueApplication %O", err)
//     cb({err: ''+err})
//   }
//
// }
//
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

module.exports = {configurationEvenements};
