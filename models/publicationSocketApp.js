var fs = require('fs');
const debug = require('debug')('millegrilles:publication:publicationSocketApp')

function configurerEvenements(socket) {
  const configurationEvenements = {
    listenersPrives: [
      {eventName: 'publication/requeteSites', callback: (params, cb) => {requeteSites(socket, params, cb)}},
      {eventName: 'publication/requeteSite', callback: (params, cb) => {requeteSite(socket, params, cb)}},
      {eventName: 'publication/requetePosts', callback: (params, cb) => {requetePosts(socket, params, cb)}},
      {eventName: 'publication/requeteNoeuds', callback: (params, cb) => {requeteNoeuds(socket, params, cb)}},
      {eventName: 'publication/requeteCollectionsPubliques', callback: (params, cb) => {requeteCollectionsPubliques(socket, params, cb)}},
      {eventName: 'publication/requeteListeCdns', callback: (params, cb) => {requeteListeCdns(socket, params, cb)}},
      {eventName: 'publication/requeteCleSsh', callback: (params, cb) => {requeteCleSsh(socket, params, cb)}},
      {eventName: 'publication/requeteForums', callback: (params, cb) => {requeteForums(socket, params, cb)}},
      {eventName: 'publication/requeteSectionsSite', callback: (params, cb) => {requeteSectionsSite(socket, params, cb)}},
      {eventName: 'publication/requetePartiesPage', callback: (params, cb) => {requetePartiesPage(socket, params, cb)}},
    ],
    listenersProteges: [
      {eventName: 'publication/creerSite', callback: (transaction, cb) => {
        soumettreTransaction(socket, transaction, 'Publication.creerSite', cb)
      }},
      {eventName: 'publication/majSite', callback: (transaction, cb) => {
        soumettreTransaction(socket, transaction, 'Publication.majSite', cb)
      }},
      {eventName: 'publication/majSection', callback: (transaction, cb) => {
        soumettreTransaction(socket, transaction, 'Publication.majSection', cb)
      }},
      {eventName: 'publication/majPost', callback: (transaction, cb) => {
        soumettreTransaction(socket, transaction, 'Publication.majPost', cb)
      }},
      {eventName: 'publication/majCdn', callback: (params, cb) => {
        soumettreMajCdn(socket, params, cb)
      }},
      {eventName: 'publication/supprimerCdn', callback: (transaction, cb) => {
        soumettreTransaction(socket, transaction, 'Publication.supprimerCdn', cb)
      }},
    ]
  }

  return configurationEvenements
}

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

function requetePosts(socket, params, cb) {
  executerRequete('Publication.posts', socket, params, cb)
}

function requeteNoeuds(socket, params, cb) {
  executerRequete('Topologie.listeNoeuds', socket, params, cb)
}

function requeteCollectionsPubliques(socket, params, cb) {
  executerRequete('GrosFichiers.collectionsPubliques', socket, params, cb)
}

function requeteListeCdns(socket, params, cb) {
  executerRequete('Publication.listeCdn', socket, params, cb)
}

function requeteCleSsh(socket, params, cb) {
  executerRequete('fichiers.getPublicKeySsh', socket, params, cb)
}

function requeteForums(socket, params, cb) {
  executerRequete('Forum.getForums', socket, params, cb)
}

function requeteSectionsSite(socket, params, cb) {
  executerRequete('Publication.listeSectionsSite', socket, params, cb)
}

function requetePartiesPage(socket, params, cb) {
  executerRequete('Publication.partiesPages', socket, params, cb)
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

async function soumettreMajCdn(socket, params, cb) {
  const transactionPublication = params.publication,
        commandeMaitredescles = params.maitredescles

  try {
    const amqpdao = socket.amqpdao
    if(commandeMaitredescles) {
      const domaineAction = commandeMaitredescles['en-tete'].domaine
      if(domaineAction !== 'MaitreDesCles.sauvegarderCle') {
        return cb({err: 'Commande maitre des cles a un mauvais domaine'})
      }
      const reponseMaitredescles = await amqpdao.transmettreCommande(domaineAction, commandeMaitredescles)
      debug("Reponse maitredescles : %O", reponseMaitredescles)
    }

    await soumettreTransaction(socket, transactionPublication, 'Publication.majCdn', cb)
  } catch(err) {
    console.error("ERROR publicationSocketApp.soumettreMajCdn %O", err)
    return cb({err: ''+err})
  }
}

module.exports = {configurerEvenements}
