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
import {Menu} from './containers/Menu'

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

    afficherSection: '',
  }

  componentDidMount() {
    setupWorkers(this).then( async _ =>{
      // console.debug("Workers charges, info session : %O, proppys : %O", this.state, this.props)

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

  setAfficherSection = event => {
    // console.debug("Afficher section : %O", event)
    const afficherSection = event.currentTarget?event.currentTarget.value:event
    this.setState({afficherSection})
  }

  setSousMenuApplication = sousMenuApplication => {
    console.debug("Set sous-menu application")
    this.setState({sousMenuApplication})
  }

  setConnexionSocketIo = connexionSocketIo => {
    this.setState({connexionSocketIo})
  }

  toggleProtege = async () => {
    if( this.state.modeProtege ) {
      // Desactiver mode protege
      this.state.connexionWorker.downgradePrive()
    } else {
      // Activer mode protege, upgrade avec certificat (implicite)
      // console.debug("toggleProtege")
      try {
        const resultat = await this.state.connexionWorker.upgradeProteger()
      } catch(err) {
        console.error("Erreur upgrade protege %O", err)
      }
    }
  }

  async preparerWorkersAvecCles() {
    const {nomUsager, chiffrageWorker, connexionWorker} = this.state
    await preparerWorkersAvecCles(nomUsager, chiffrageWorker, connexionWorker)
  }

  deconnexionSocketIo = comlinkProxy(event => {
    // console.debug("Socket.IO deconnecte : %O", event)
    this.setState({modeProtege: false})
  })

  reconnectSocketIo = comlinkProxy(event => {
    console.debug("Socket.IO reconnecte : %O", event)
    if(!this.state.modeProtege) {
      this.toggleProtege()
    }
  })

  setEtatProtege = comlinkProxy(reponse => {
    // console.debug("Callback etat protege : %O", reponse)
    const modeProtege = reponse.etat
    // console.debug("Toggle mode protege, nouvel etat : %O", reponse)
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
      page = <ApplicationPublication setSousMenuApplication={this.setSousMenuApplication}
                                     afficherSection={this.state.afficherSection}
                                     setAfficherSection={this.setAfficherSection}
                                     rootProps={{...this.state}} />
    }

    return (

      <Layout changerPage={this.changerPage}
              rootProps={rootProps}
              setAfficherSection={this.setAfficherSection}
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
                  setAfficherSection={this.props.setAfficherSection}
                  rootProps={this.props.rootProps} />

          <Container className="layout-contenu">
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
      <Menu changerPage={props.setAfficherSection}
            rootProps={props.rootProps}/>
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
