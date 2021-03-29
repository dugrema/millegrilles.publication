import React from 'react'
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap'
import openSocket from 'socket.io-client'
import {proxy as comlinkProxy} from 'comlink'

import {getCertificats, getClesPrivees} from './components/pkiHelper'
import {splitPEMCerts} from '@dugrema/millegrilles.common/lib/forgecommon'

// import { WebSocketManager } from 'millegrilles.common/lib/webSocketManager'
import { Trans } from 'react-i18next';

import {setupWorkers, cleanupWorkers, preparerWorkersAvecCles} from './workers/workers.load'

// import {ConnexionWebsocket} from '../containers/Authentification'
import {ApplicationPublication} from './containers/App'

import './containers/App.css'
import './containers/Layout.css'

import manifest from './manifest.build.js'

export default class AppTopLevel extends React.Component {

  state = {
    //websocketApp: null,         // Connexion socket.io
    modeProtege: false,         // Mode par defaut est lecture seule (prive)
    sousMenuApplication: null,

    chiffrageWorker: '',
    chiffrageInstance: '',
    connexionWorker: '',
    connexionWorkerInstance: '',

    signateurTransaction: '',
  }

  componentDidMount() {
    setupWorkers(this).then( async _ =>{
      console.debug("Workers charges, info session : %O, proppys : %O", this.state, this.props)

      this.setState({
        signateurTransaction: {preparerTransaction: this.state.chiffrageWorker.formatterMessage}, // Legacy
      })

      await this.preparerWorkersAvecCles()
      this.toggleProtege()  // Tenter upgrade protege automatiquement
    })

  }

  componentWillUnmount() {
    cleanupWorkers(this)
  }

  setSousMenuApplication = sousMenuApplication => {
    console.debug("Set sous-menu application")
    this.setState({sousMenuApplication})
  }

  // setWebsocketApp = websocketApp => {
  //   // Set la connexion Socket.IO. Par defaut, le mode est prive (lecture seule)
  //   this.setState({websocketApp, modeProtege: false})
  // }

  setConnexionSocketIo = connexionSocketIo => {
    this.setState({connexionSocketIo})
  }

  toggleProtege = async () => {
    if( this.state.modeProtege ) {
      // Desactiver mode protege
      this.state.connexionWorker.downgradePrive()
    } else {
      // Activer mode protege, upgrade avec certificat (implicite)
      console.debug("toggleProtege")
      try {
        const resultat = await this.state.connexionWorker.upgradeProteger()
      } catch(err) {
        console.error("Erreur upgrade protege %O", err)
      }
    }
  }

  async preparerWorkersAvecCles() {
    const {nomUsager, chiffrageWorker, connexionWorker} = this.state

    // Initialiser certificat de MilleGrille et cles si presentes
    const certInfo = await getCertificats(nomUsager)
    if(certInfo && certInfo.fullchain) {
      const fullchain = splitPEMCerts(certInfo.fullchain)
      const clesPrivees = await getClesPrivees(nomUsager)

      // Initialiser le CertificateStore
      await chiffrageWorker.initialiserCertificateStore([...fullchain].pop(), {isPEM: true, DEBUG: false})
      console.debug("Certificat : %O, Cles privees : %O", certInfo.fullchain, clesPrivees)

      // Initialiser web worker
      await chiffrageWorker.initialiserFormatteurMessage({
        certificatPem: certInfo.fullchain,
        clePriveeSign: clesPrivees.signer,
        clePriveeDecrypt: clesPrivees.dechiffrer,
        DEBUG: true
      })

      await connexionWorker.initialiserFormatteurMessage({
        certificatPem: certInfo.fullchain,
        clePriveeSign: clesPrivees.signer,
        clePriveeDecrypt: clesPrivees.dechiffrer,
        DEBUG: true
      })
    } else {
      throw new Error("Pas de cert")
    }
  }

  deconnexionSocketIo = comlinkProxy(event => {
    console.debug("Socket.IO deconnecte : %O", event)
    this.setState({modeProtege: false})
  })

  reconnectSocketIo = comlinkProxy(event => {
    console.debug("Socket.IO reconnecte : %O", event)
    if(!this.state.modeProtege) {
      this.toggleProtege()
    }
  })

  setEtatProtege = comlinkProxy(reponse => {
    console.debug("Callback etat protege : %O", reponse)
    const modeProtege = reponse.etat
    console.debug("Toggle mode protege, nouvel etat : %O", reponse)
    this.setState({modeProtege})
  })

  render() {

    const rootProps = {...this.state, manifest, toggleProtege: this.toggleProtege}

    let page;
    if(!this.state.nomUsager || !this.state.connexionWorker) {
      // Connecter avec Socket.IO
      page = <p>Chargement en cours</p>
    } else {
      // 3. Afficher application
      page = <ApplicationPublication setSousMenuApplication={this.setSousMenuApplication} rootProps={{...this.state}} />
    }

    return (

      <Layout changerPage={this.changerPage}
              rootProps={rootProps}
              sousMenuApplication={this.state.sousMenuApplication}
              appProps={this.props}>

          {page}

      </Layout>
    )
  }

}

export class Layout extends React.Component {

  render() {
    // Application independante (probablement pour DEV)
    return (
      <div className="flex-wrapper">
        <div>
          <Entete changerPage={this.props.changerPage}
                  sousMenuApplication={this.props.sousMenuApplication}
                  rootProps={this.props.rootProps} />

          <Container>
            {this.props.children}
          </Container>

        </div>
        <Footer rootProps={this.props.rootProps}/>
      </div>
    )
  }
}

function Entete(props) {
  return (
    <Container>
      <Menu changerPage={props.changerPage} sousMenuApplication={props.sousMenuApplication} rootProps={props.rootProps}/>
    </Container>
  )
}

function Footer(props) {

  const idmg = props.rootProps.idmg
  var qrCode = 'QR'

  return (
    <Container fluid className="footer bg-info">
      <Row>
        <Col sm={2} className="footer-left"></Col>
        <Col sm={8} className="footer-center">
          <div className="millegrille-footer">
            <div>IDMG : {idmg}</div>
            <div>
              <Trans>application.publicationAdvert</Trans>{' '}
              <span title={props.rootProps.manifest.date}>
                <Trans values={{version: props.rootProps.manifest.version}}>application.publicationVersion</Trans>
              </span>
            </div>
          </div>
        </Col>
        <Col sm={2} className="footer-right">{qrCode}</Col>
      </Row>
    </Container>
  )
}

function Menu(props) {

  let boutonProtege
  if(props.rootProps.modeProtege) {
    boutonProtege = <i className="fa fa-lg fa-lock protege"/>
  } else {
    boutonProtege = <i className="fa fa-lg fa-unlock"/>
  }

  var menuItems = props.sousMenuApplication

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/'><i className="fa fa-home"/></Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        {menuItems}
        <Nav className="justify-content-end">
          <Nav.Link onClick={props.rootProps.toggleProtege}>{boutonProtege}</Nav.Link>
          <Nav.Link onClick={props.rootProps.changerLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}
