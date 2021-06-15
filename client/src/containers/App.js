import React, {useState} from 'react'
import {Alert, Nav, Row, Col, Button} from 'react-bootstrap'

import { VerificationInfoServeur } from './Authentification'
import { MenuItems } from './Menu'

import {getCertificats, getClesPrivees} from '../components/pkiHelper'

import ListeSites from './ListeSites'
import CDNConfig from './ContentDeliveryNetworkConfig'
import PagesSites from './PagesSites'
import EditerForum from './EditerForum'
import Deployer from './Deployer'

import './App.css'
import $ from 'jquery'
window.jQuery = $

// import manifest from '../../../manifest.build.js'
var manifestImport = {
  date: "DUMMY-Date",
  version: "DUMMY-Version",
}
// try {
//   manifestImport = require('../../../manifest.build.js')
// } catch(err) {
//   // Ok
// }
const manifest = manifestImport

export class ApplicationPublication extends React.Component {

  state = {
    serveurInfo: null,          // Provient de /coupdoeil/info.json
    idmg: null,                 // IDMG actif
    hebergement: false,

    websocketApp: '',

    // afficherSection: '',
    err: '',
  }

  componentDidMount() {

    const wsa = this.props.rootProps.connexionWorker
    wsa.isFormatteurReady()
      .then( async _ =>{
        // console.debug("Formatteur ready sur connexion")
        this.setState({websocketApp: wsa})
      })

  }

  setInfoServeur = (info) => {
    this.setState(info)
  }

  changerPage = event => {
    // Retour page accueil
    var afficherSection = event.currentTarget?event.currentTarget.value:event
    this.props.setAfficherSection(afficherSection)
  }

  clearErreur = _ => {
    this.setState({err: ''})
  }

  // setAfficherSection = event => {
  //   const afficherSection = event.currentTarget?event.currentTarget.value:event
  //   this.setState({afficherSection})
  // }

  retour = _ => {
    this.props.setAfficherSection('')
  }

  render() {

    const rootProps = {
      ...this.props, ...this.props.rootProps, ...this.state,
      manifest,
      changerPage: this.changerPage,
      setSiteId: this.setSiteId,
    }

    let page;
    if(!this.state.serveurInfo) {
      // 1. Recuperer information du serveur
      page = <VerificationInfoServeur setInfoServeur={this.setInfoServeur} />
    } else if(!this.state.websocketApp) {
      // 2. Connecter avec Socket.IO
      page = <p>Attente de connexion</p>
    } else {

      var ElementPage = null
      switch(this.props.afficherSection) {
        case 'cdnConfig':
          ElementPage = CDNConfig; break
        case 'listeSites':
          ElementPage = ListeSites; break
        case 'pagesSites':
          ElementPage = PagesSites; break
        case 'editerForum':
          ElementPage = EditerForum; break
        case 'deployer':
          ElementPage = Deployer; break
        default:
          ElementPage = ChoisirSection
      }

      page = <ElementPage rootProps={rootProps}
                          setAfficherSection={this.props.setAfficherSection}
                          retour={this.retour} />
    }

    // if(this.state.afficherSection === 'cdnConfig') {
    //   // Editer un site selectionne
    //   page = <CDNConfig rootProps={rootProps}
    //                     siteId={this.state.siteId}
    //                     retour={this.retour} />
    // } else if(this.state.afficherSection === 'editerSite') {
    //   // Editer un site selectionne
    //   page = <EditerSite rootProps={rootProps}
    //                      siteId={this.state.siteId}
    //                      retour={this.retour} />
    // } else if(this.state.afficherSection === 'listeSites') {
    //   // Afficher la liste des sites
    //   page = <ListeSites rootProps={rootProps}
    //                      setSiteId={this.setSiteId}
    //                      creerSite={this.creerSite} />
    // } else {
    //
    // }

    return (
      <>
        <AlertErreur err={this.state.err} clearErreur={this.clearErreur}/>
        {page}
      </>
    )
  }

}

function ChoisirSection(props) {
  return (
    <>
      <h2>Publication</h2>

      <p>Choisir une section</p>

      <Nav onSelect={props.setAfficherSection} className="flex-column">
        <Nav.Link eventKey="listeSites">Sites</Nav.Link>
        <Nav.Link eventKey="cdnConfig">Destinations Content Delivery Network</Nav.Link>
        <Nav.Link eventKey="pagesSites">Pages Sites</Nav.Link>
        <Nav.Link eventKey="editerForum">Editer Forum</Nav.Link>
        <Nav.Link eventKey="deployer">Deployer</Nav.Link>
      </Nav>

    </>
  )
}

function AlertErreur(props) {
  return (
    <Alert variant="danger" show={props.err!==''} onClose={props.clearErreur} dismissible>
      <Alert.Heading>Erreur</Alert.Heading>
      <pre>{''+props.err}</pre>
    </Alert>
  )
}
