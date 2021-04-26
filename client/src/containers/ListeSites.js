import React from 'react'
import {Row, Col, Button, Nav} from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

import EditerSite from './EditerSite'

const routingKeysSite = [
  'transaction.Publication.*.majSite',
  'transaction.Publication.majSite',
]

export default class ListeSites extends React.Component {

  state = {
    sites: '',
    siteId: '',
  }

  componentDidMount() {
    // console.debug("Chargement liste des sites, props: %O", this.props)
    const wsa = this.props.rootProps.websocketApp
    wsa.requeteSites({}).then(sites=>{
      // console.debug("Sites charges : %O", sites)
      this.setState({sites}, _=>{
        // Enregistrer evenements
        wsa.subscribe(routingKeysSite, this.messageRecu, {exchange: ['3.protege']})
      })
    })
  }

  componentWillUnmount() {
    const wsa = this.props.rootProps.websocketApp
    wsa.unsubscribe(routingKeysSite, this.messageRecu, {exchange: ['3.protege']})
  }

  messageRecu = comlinkProxy(event => {
    console.debug("Message MQ recu : %O", event)

    const message = event.message,
          routingKey = event.routingKey
    const action = routingKey.split('.').pop()

    // Mapping de l'action
    if(action === 'majSite') {
      const sites = majListeSites(message, this.state.sites)
      this.setState({sites})
    }
  })

  setSiteId = event => {
    const value = event.currentTarget.value
    this.setState({siteId: value})
  }

  creerSite = async _ => {
    console.debug("Creer nouveau site")
    // const domaineAction = 'Publication.majSite'
    // var transaction = {}

    // Signer transaction, soumettre
    //const signateurTransaction = this.state.signateurTransaction
    // const webWorker = this.props.rootProps.chiffrageWorker
    // //await signateurTransaction.preparerTransaction(transaction, domaineAction)
    // transaction = await webWorker.formatterMessage(transaction, domaineAction)
    // const siteId = transaction['en-tete']['uuid_transaction']
    // console.debug("Nouveau site, Transaction a soumettre : %O", transaction)

    const wsa = this.props.rootProps.connexionWorker
    try {
      const reponse = await wsa.majSite({})
      console.debug("Reponse nouveau site : %O", reponse)
      this.setState({siteId: reponse.siteId})
    } catch (err) {
      console.error("Erreur creer site : %O", err)
      this.setState({err})
    }
  }

  render() {

    if(this.state.siteId) {
      // Editer un site
      return (
        <EditerSite rootProps={this.props.rootProps}
                    siteId={this.state.siteId}
                    retour={this.setSiteId} />
      )
    }

    // Afficher liste de sites
    return (
      <>
        <h1>Sites</h1>

        <Nav.Link onClick={this.props.retour}>Retour</Nav.Link>

        <AfficherListeSites sites={this.state.sites}
                            setSiteId={this.setSiteId} />

        <Row>
          <Col>
            <Button variant="secondary"
                    onClick={this.creerSite}
                    disabled={!this.props.rootProps.modeProtege}>Nouveau site</Button>
          </Col>
        </Row>
      </>
    )
  }

}

function AfficherListeSites(props) {

  var sitesTries = [...props.sites]
  sitesTries = sitesTries.sort((a, b)=>{
    const nomA = a.nom_site || a.site_id,
          nomB = b.nom_site || b.site_id
    return nomA.localeCompare(nomB)
  })

  const mapSite = sitesTries.map(item=>{
    const nomSite = item.nom_site || item.site_id
    return (
      <Row key={item.site_id}>
        <Col>
          <Button variant="link" onClick={props.setSiteId} value={item.site_id}>
            {nomSite}
          </Button>
        </Col>
      </Row>
    )
  })

  return mapSite
}

function majListeSites(message, sites) {

  const derniereModification = message['en-tete'].estampille
  const mappingMessage = {
    site_id: message.site_id || message['en-tete']['uuid_transaction'],
    nom_site: message.nom_site,
    '_mg-derniere-modification': derniereModification,
  }

  if( ! message.site_id ) {
    // Nouveau site, on l'ajoute a la liste
    return [...sites, mappingMessage]
  }

  // Remplacer site en memoire
  return sites.map(item=>{
    if(item.site_id === message.site_id) return mappingMessage  // Remplacer
    return item  // Aucun changement
  })

}
