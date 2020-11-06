var fs = require('fs');
const debug = require('debug')('millegrilles:publication:coupdoeilSocketApp')

function configurationEvenements(socket) {
  const configurationEvenements = {
    listenersPrives: [
      // {eventName: 'coupdoeil/requeteListeNoeuds', callback: (params, cb) => {requeteListeNoeuds(socket, params, cb)}},
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
//
// function requeteListeNoeuds(socket, params, cb) {
//   executerRequete('Topologie.listeNoeuds', socket, params, cb)
// }

module.exports = {configurationEvenements};
