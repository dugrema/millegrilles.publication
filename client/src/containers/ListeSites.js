import React from 'react'
import {Row, Col, Button, Nav, Form, Alert} from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

import EditerSite from './EditerSite'

const routingKeysSite = [
  'transaction.Publication.*.majSite',
  'transaction.Publication.majSite',
]

export default class ListeSites extends React.Component {

  state = {
    mapping: '',
    sites: '',
    siteId: '',
    siteDefaut: '',

    confirmation: '',
    err: '',
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
   wsa.requeteMapping({}).then(mapping=>{
     console.debug("Mapping charges : %O", mapping)
     this.setState({mapping})
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
    const wsa = this.props.rootProps.connexionWorker
    try {
      const reponse = await wsa.creerSite({})
      // console.debug("Reponse nouveau site : %O", reponse)
      this.setState({siteId: reponse.site.site_id})
    } catch (err) {
      console.error("Erreur creer site : %O", err)
      this.setState({err})
    }
  }

  setDefaut = event => {
    const {name, value} = event.currentTarget
    this.setState({'siteDefaut': value})
  }

  sauvegarderMapping = async () => {
    const connexionWorker = this.props.rootProps.connexionWorker
    if(this.state.siteDefaut) {
      const reponse = await connexionWorker.setSiteDefaut({site_defaut: this.state.siteDefaut})
      console.debug("Reponse : %O", reponse)
      if(reponse.ok) {
        this.setState({
          confirmation: 'Changement de site par defaut complete.',
          mapping: reponse.mapping,
        })
      }
    } else {
      console.debug("Aucun changement au site par defaut")
    }
  }

  fermerMessages = () => {
    this.setState({err: '', confirmation: ''})
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

    const mapping = this.state.mapping || {}
    var siteDefaut = this.state.siteDefaut || mapping.site_defaut

    // Afficher liste de sites
    return (
      <>
        <h1>Sites</h1>

        <Nav.Link onClick={this.props.retour}>Retour</Nav.Link>

        <Form>
          <Row>
            <Col lg={1}>Defaut</Col>
            <Col>Site</Col>
          </Row>

          <AfficherListeSites sites={this.state.sites}
                              setSiteId={this.setSiteId}
                              siteDefaut={siteDefaut}
                              setDefaut={this.setDefaut} />

          <Row>
            <Col>
              <Button variant="secondary"
                      onClick={this.creerSite}
                      disabled={!this.props.rootProps.modeProtege}>
                <span title="Ajouter un nouveau site"><i className="fa fa-plus"/></span>
              </Button>
            </Col>
          </Row>

          <AlertMessages confirmation={this.state.confirmation}
                         err={this.state.err}
                         fermerMessages={this.fermerMessages}/>

          <Row>
            <Col>
              <Button variant="primary"
                      onClick={this.sauvegarderMapping}
                      disabled={!this.props.rootProps.modeProtege}>Sauvegarder</Button>
            </Col>
          </Row>
        </Form>
      </>
    )
  }

}

function AlertMessages(props) {
  var showErr = props.err?true:false
  var showConf = !showErr && props.confirmation?true:false
  return (
    <>
      <Alert show={showErr} variant="danger" onClose={props.fermerMessages} dismissible>
        <Alert.Heading>Erreur</Alert.Heading>
        <pre>{props.err}</pre>
      </Alert>
      <Alert show={showConf} variant="success" onClose={props.fermerMessages} dismissible>
        <Alert.Heading>Confirmation</Alert.Heading>
        <pre>{props.confirmation}</pre>
      </Alert>
    </>
  )

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
    var estDefaut = props.siteDefaut === item.site_id

    return (
      <Row key={item.site_id}>
        <Col lg={1}>
          <Form.Check type="radio"
                      id={`defaut-${item.site_id}`}
                      onChange={props.setDefaut}
                      name="siteDefaut"
                      value={item.site_id}
                      checked={estDefaut} />
        </Col>
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
    liste_sections: message.liste_sections,
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
