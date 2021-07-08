import React, {useState, useEffect} from 'react'
import {Alert, Nav, Row, Col, Button, Form} from 'react-bootstrap'

export default function Deployer(props) {

  const [sites, setSites] = useState([])
  const [cdns, setCdns] = useState([])
  const connexion = props.workers.connexion

  useEffect(_=>{
    connexion.requeteSites({}).then(sites=>{
      console.debug("Sites charges : %O", sites)
      setSites(sites)
    })
    connexion.requeteListeCdns({}).then(cdns=>{
      console.debug("CDNs charges : %O", cdns)
      setCdns(cdns)
    })
  }, [connexion, setSites, setCdns])

  return (
    <>
      <h2>Deployer</h2>
      <Button onClick={props.retour}>Retour</Button>

      <BoutonsActions sites={sites}
                      cdns={cdns}
                      connexionWorker={props.rootProps.connexionWorker} />

      <RapportEtat connexionWorker={props.rootProps.connexionWorker} />
    </>
  )
}

function BoutonsActions(props) {

  const [siteSelectionne, setSiteSelectionne] = useState('')
  const [cdnSelectionne, setCdnSelectionne] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')

  const connexionWorker = props.connexionWorker
  const publierChangements = async _ => {
    // console.debug("Publier changements")
    setConfirmation('')
    setErreur('')
    try {
      const reponse = await connexionWorker.publierChangements(siteSelectionne)
      console.debug("Confirmation publier changements : %O", confirmation)
      setConfirmation('Ok')
    } catch(err) {
      setErreur(''+err)
    }
  }

  const resetData = async _ => {
    // console.debug("Reset data")
    setConfirmation('')
    setErreur('')
    try {
      const reponse = await connexionWorker.resetData(siteSelectionne)
      console.debug("Confirmation reset data : %O", confirmation)
      setConfirmation('Ok')
    } catch(err) {
      setErreur(''+err)
    }
  }

  const resetFichiers = async _ => {
    // console.debug("Reset fichiers")
    setConfirmation('')
    setErreur('')
    try {
      const reponse = await connexionWorker.resetFichiers(cdnSelectionne)
      console.debug("Confirmation reset fichiers : %O", confirmation)
      setConfirmation('Ok')
    } catch(err) {
      setErreur(''+err)
    }
  }

  const resetWebapps = async _ => {
    // console.debug("Reset webapps")
    setConfirmation('')
    setErreur('')
    try {
      const reponse = await connexionWorker.resetWebapps(cdnSelectionne)
      console.debug("Confirmation reset webapps : %O", confirmation)
      setConfirmation('Ok')
    } catch(err) {
      setErreur(''+err)
    }
  }

  return (
    <>
      <h3>Actions par site</h3>

      <Alert variant="success" show={confirmation?true:false}>{''+confirmation}</Alert>
      <Alert variant="danger" show={erreur?true:false}>{''+erreur}</Alert>

      <Form.Group controlId='siteSelect'>
        <Row>
          <Col md={8}>
            <Form.Label>Site</Form.Label>
          </Col>
          <Col>
            <Form.Control as='select'
                          name='site'
                          onChange={event=>{setSiteSelectionne(event.currentTarget.value)}}
                          value={siteSelectionne}>
              <option value=''>Tous</option>
              {props.sites.map(site=>{
                return (
                  <option key={site.site_id} value={site.site_id}>
                    {site.nom_site}
                  </option>
                )
              })}
            </Form.Control>
          </Col>
        </Row>
      </Form.Group>

      <Row>
        <Col lg={8}>
          Publier tous les changements.
        </Col>
        <Col>
          <Button onClick={publierChangements}>Publier changements</Button>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          Reset les documents (siteconfig, pages, liste de fichiers). N'affecte pas
          le contenu des fichiers.
        </Col>
        <Col>
          <Button onClick={resetData}>Reset data</Button>
        </Col>
      </Row>

      <h3>Actions par CDN</h3>

      <Form.Group controlId='cdnSelect'>
        <Row>
          <Col md={8}>
            <Form.Label>CDN</Form.Label>
          </Col>
          <Col>
            <Form.Control as='select'
                          name="cdn"
                          onChange={event=>{setCdnSelectionne(event.currentTarget.value)}}
                          value={cdnSelectionne}>
              <option value=''>Tous</option>
              {props.cdns.map(cdn=>{
                return (
                  <option key={cdn.cdn_id} value={cdn.cdn_id}>
                    {cdn.description}
                  </option>
                )
              })}
            </Form.Control>
          </Col>
        </Row>
      </Form.Group>

      <Row>
        <Col lg={8}>
          Reset les fichiers. Permet de republier tous les fichiers sur tous les CDNs.
        </Col>
        <Col>
          <Button onClick={resetFichiers}>Reset fichiers</Button>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          Reset le code des web apps (vitrine et place) et le mapping (index.json).
          Permet de republier le code sur tous les CDNs.
        </Col>
        <Col>
          <Button onClick={resetWebapps}>Reset webapps</Button>
        </Col>
      </Row>
    </>
  )
}

function RapportEtat(props) {

  const [rapport, setRapport] = useState('')
  const [dictCdns, setDictCdns] = useState({})

  useEffect(_=>{
    // Charger metadonnees CDNs (noms)
    chargerCdns(props.connexionWorker, setDictCdns)
  }, [])

  useEffect(_=>{
    rafraichirDonnees()
    const timerRafraichissement = setInterval(rafraichirDonnees, 5000)
    return _=> {
      // console.debug("Clear interval %O", timerRafraichissement)
      clearInterval(timerRafraichissement)
    }
  }, [])

  const rafraichirDonnees = async _ => {
    console.debug("Rafraichir donnees")
    const rapport = await props.connexionWorker.getEtatPublication()
    console.debug("Resultat rapport : %O", rapport)
    setRapport(rapport)
  }

  return (
    <>
      <h2>Etat de la publication</h2>

      <AfficherCdns rapport={rapport}
                    dictCdns={dictCdns}
                    connexionWorker={props.connexionWorker} />

      <AfficherErreurs rapport={rapport}
                       dictCdns={dictCdns} />
    </>
  )
}

function AfficherCdns(props) {

  const rapport = props.rapport
  let listeCdns = rapport.cdns || []
  listeCdns = [...listeCdns]
  listeCdns.sort()

  if(listeCdns.length === 0) {
    return (
      <p>Aucune activite en cours</p>
    )
  }

  return listeCdns.map(item=>{
    const infoCdn = props.dictCdns[item] || ''
    return (
      <div key={item}>
        <h3>{infoCdn.description || item}</h3>

        <AfficherPublicationCdn cdnId={item}
                                rapport={rapport} />

      </div>
    )
  })
}

function AfficherPublicationCdn(props) {
  const cdnId = props.cdnId
  const progres = props.rapport.en_cours[cdnId]

  if(!progres) return ''

  const typeDocuments = Object.keys(progres)
  typeDocuments.sort()

  return typeDocuments.map(item=>{
    const nombreRessources = progres[item]
    return (
      <Row key={item}>
        <Col lg={4}>{item}</Col>
        <Col lg={1}>{nombreRessources}</Col>
      </Row>
    )
  })
}

function AfficherErreurs(props) {
  if(!props.rapport || !props.rapport.erreurs || props.rapport.erreurs.length === 0) return (
    <>
      <h3>Erreurs</h3>
      <p>Aucunes erreurs.</p>
    </>
  )

  // Preparer donnees par CDN
  const dictErreursParCdn = {}
  props.rapport.erreurs.forEach(item=>{
    for(let cdnId in item.distribution_erreur) {
      let listeErreurs = dictErreursParCdn[cdnId]
      if(!listeErreurs) {
        listeErreurs = []
        dictErreursParCdn[cdnId] = listeErreurs
      }
      listeErreurs.push({
        err: item.distribution_erreur[cdnId],
        ...item,
      })
    }
  })

  const listeCdnIds = Object.keys(dictErreursParCdn)
  listeCdnIds.sort()

  return (
    <>
      <h3>Erreurs</h3>

      {Object.keys(dictErreursParCdn).map((cdnId, idx)=>{
        const infoCdn = props.dictCdns[cdnId] || ''
        const nomCdn = infoCdn.description || cdnId
        return <AfficherErreursCdn key={idx}
                                   cdnId={cdnId}
                                   nomCdn={nomCdn}
                                   erreurs={dictErreursParCdn[cdnId]} />
      })}
    </>
  )

}

function AfficherErreursCdn(props) {

  const erreurs = [...props.erreurs]
  erreurs.sort((a,b)=>{
    const typeA = a['_mg-libelle'],
          typeB = b['_mg-libelle'],
          idA = a.fuuid || a.uuid || a.section_id || a.site_id,
          idB = b.fuuid || b.uuid || b.section_id || b.site_id

    if(typeA!==typeB) return typeA.localeCompare(typeB)
    if(idA!==idB) return idA.localeCompare(idB)
    return 0
  })

  return (
    <>
      <p>CDN: <strong>{props.nomCdn}</strong> ({props.cdnId})</p>

      {erreurs.map((item, idx)=>{
        return (
          <Row key={idx}>
            <Col lg={2}>{item['_mg-libelle']}</Col>
            <Col lg={5}>
              <span className="identificateur-tronquer">
                {item.fuuid || item.uuid || item.section_id || item.site_id}
              </span>
            </Col>
            <Col>{item.err}</Col>
          </Row>
        )
      })}
    </>
  )
}

async function chargerCdns(connexionWorker, setDictCdns) {
  const cdns = await connexionWorker.requeteListeCdns()
  // console.debug("Liste cdns : %O", cdns)

  let dictCdns = {}
  cdns.forEach(item=>{
    dictCdns[item.cdn_id] = item
  })

  setDictCdns(dictCdns)
}
