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

function requeteSectionsSite(siteId) {
  return connexionClient.emitBlocking('publication/requeteSectionsSite', {site_id: siteId})
}

function requeteSection(sectionId) {
  return connexionClient.emitBlocking('publication/requeteSection', {section_id: sectionId})
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

function requetePartiesPage(sectionId) {
  return connexionClient.emitBlocking('publication/requetePartiesPage', {section_id: sectionId})
}

// Commandes

function creerSite(transaction) {
  return connexionClient.emitBlocking('publication/creerSite', transaction, {domaine: 'Publication.creerSite'})
}

function majSite(transaction) {
  return connexionClient.emitBlocking('publication/majSite', transaction, {domaine: 'Publication.majSite'})
}

function majSection(transaction) {
  return connexionClient.emitBlocking('publication/majSection', transaction, {domaine: 'Publication.majSection'})
}

function ajouterPartiePage(siteId, sectionId, typePartie) {
  const transaction = {
    site_id: siteId,
    section_id: sectionId,
    type_partie: typePartie,
  }
  return connexionClient.emitBlocking(
    'publication/majPartiePage', transaction, {domaine: 'Publication.majPartiePage'})
}

function majPartiePage(partiePageId, configuration) {
  const transaction = {
    ...configuration,
    partiepage_id: partiePageId,
  }
  return connexionClient.emitBlocking(
    'publication/majPartiePage', transaction, {domaine: 'Publication.majPartiePage'})
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
  requeteForums, requeteSectionsSite, requeteSection, requetePartiesPage,

  creerSite, majSite, majSection, majCdn, supprimerCdn,
  ajouterPartiePage, majPartiePage,
})
