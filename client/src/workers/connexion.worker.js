import {expose as comlinkExpose} from 'comlink'

import connexionClient from '@dugrema/millegrilles.common/lib/connexionClient'

const URL_SOCKET = '/publication/socket.io'

function connecter(opts) {
  opts = opts || {}
  const url = opts.url || URL_SOCKET
  return connexionClient.connecter(url, opts)
}

function requeteSites(params) {
  return connexionClient.emitBlocking('publication/requeteSites', params)
}

function requeteSite(siteId) {
  return connexionClient.emitBlocking('publication/requeteSite', {site_id: siteId})
}

function requetePosts(post_ids) {
  return connexionClient.emitBlocking('publication/requetePosts', {post_ids})
}

function requeteNoeudsPublics() {
  return connexionClient.emitBlocking('publication/requeteNoeuds', {})
}

function requeteCollectionsPubliques() {
  return connexionClient.emitBlocking('publication/requeteCollectionsPubliques', {})
}

function requeteListeCdns() {
  return connexionClient.emitBlocking('publication/requeteListeCdns', {})
}

function requeteCleSsh() {
  return connexionClient.emitBlocking('publication/requeteCleSsh', {})
}

function requeteForums() {
  return connexionClient.emitBlocking('publication/requeteForums', {})
}

// Commandes

function majSite(transaction) {
  return connexionClient.emitBlocking('publication/majSite', transaction)
}

function majPost(transaction) {
  return connexionClient.emitBlocking('publication/majPost', transaction)
}

function majCdn(params) {
  return connexionClient.emitBlocking('publication/majCdn', params)
}

function supprimerCdn(transaction) {
  return connexionClient.emitBlocking('publication/supprimerCdn', transaction, {domaine: 'Publication.supprimerCdn'})
}

comlinkExpose({
  ...connexionClient,
  connecter,  // Override de connexionClient.connecter

  requeteSites, requeteSite, requetePosts, requeteNoeudsPublics,
  requeteCollectionsPubliques, requeteListeCdns, requeteCleSsh,
  requeteForums,

  majSite, majPost, majCdn, supprimerCdn,
})
