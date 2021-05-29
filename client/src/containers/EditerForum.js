import React, {useState, useEffect} from 'react'
import {Row, Col, Button, Nav, Form, Alert} from 'react-bootstrap'

export default function EditerForum(props) {

  const [forums, setForums] = useState('')
  const [forumId, setForumId] = useState('')

  const {connexionWorker} = props.rootProps

  useEffect(_=>{
    chargerListeForums(connexionWorker, setForums)
  }, [])

  const _ajouterForum = _ => { creerForum(connexionWorker, forums, setForums, setForumId) }

  const _majForum = forum => {
    const listeForums = forums.map(item=>{
      if(item.forum_id === forum.forum_id) return forum
      return item
    })
    setForums(listeForums)
  }

  if(forumId) {
    const forum = forums.filter(item=>item.forum_id === forumId)[0]
    return (
      <ConfigurerForum forum={forum}
                       connexionWorker={connexionWorker}
                       majForum={_majForum}
                       retour={_=>{setForumId('')}}/>
    )
  }

  return (
    <>
      <h2>Editer forum</h2>
      <Row>
        <Nav onSelect={setForumId} className="flex-column" lg={4}>
          <NavForums forums={forums}
                     connexionWorker={connexionWorker} />
          <p></p>
          <Button variant="secondary" onClick={_ajouterForum}><i className="fa fa-plus" /></Button>
          <Nav.Link onClick={props.retour}>Retour</Nav.Link>
        </Nav>
      </Row>
    </>
  )

}

function ConfigurerForum(props) {

  const [nomForum, setNomForum] = useState('')
  const [securite, setSecurite] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [err, setErr] = useState('')

  const forum = props.forum
  const nom = forum.nom || forum.forum_id
  const securiteAffichee = securite || forum.securite

  const clearMessages = _ => {
    setErr('')
    setConfirmation('')
  }

  const sauvegarder = async event => {
    try {
      await modifierForum(props.connexionWorker, forum, nomForum, securite, props.majForum)
      setConfirmation("Changements sauvegardes")
    } catch(err) {
      setErr(err)
    }
  }

  const changerSecurite = event => {
    setSecurite(event.currentTarget.value)
  }

  return (
    <>
      <h2>Configurer forum {nom}</h2>

      <Form>
        <Form.Group>
          <Form.Label>Nom du forum</Form.Label>
          <Form.Control name="nomForum"
                        value={nomForum || forum.nom || ''}
                        onChange={event=>{setNomForum(event.currentTarget.value)}} />
        </Form.Group>

        <Form.Group>
          <Form.Label>Niveau de securite</Form.Label>
          <Form.Check type="radio"
                      id={"securite_public"}
                      name="securite"
                      value="1.public"
                      checked={securiteAffichee === '1.public'}
                      onChange={changerSecurite}
                      label="Public" />
          <Form.Check type="radio"
                      id={"securite_prive"}
                      name="securite"
                      value="2.prive"
                      checked={securiteAffichee === '2.prive'}
                      onChange={changerSecurite}
                      label="Prive" />
        </Form.Group>

      </Form>

      <AlertMessages confirmation={confirmation}
                     err={err}
                     clearMessages={clearMessages} />

      <Row>
        <Col>
          <Button onClick={sauvegarder}>Sauvegarder</Button>
          <Button variant="secondary" onClick={props.retour}>Fermer</Button>
        </Col>
      </Row>
    </>
  )
}

function AlertMessages(props) {
  var afficherConfirmation = props.confirmation?true:false
  if(props.err) afficherConfirmation = false

  return (
    <>
      <Alert show={props.err?true:false} variant="danger" onClose={props.clearMessages} dismissible>
        <Alert.Heading>Erreur</Alert.Heading>
        <pre>{'' + props.err + '\n' + props.err.stack}</pre>
      </Alert>
      <Alert show={afficherConfirmation} variant="success" onClose={props.clearMessages} dismissible>
        <Alert.Heading>Succes</Alert.Heading>
        <pre>{'' + props.confirmation}</pre>
      </Alert>
    </>
  )
}

function NavForums(props) {
  if(!props.forums) return ''

  return props.forums.map(forum=>{
    const nomForum = forum.nom || forum.forum_id
    return (
      <Nav.Link key={forum.forum_id} eventKey={forum.forum_id}>{nomForum}</Nav.Link>
    )
  })

}

async function creerForum(connexionWorker, forums, setForums, setForumId) {
  console.debug("Creer forum")
  const reponse = await connexionWorker.creerForum({})
  console.debug("Nouveau forum : %O", reponse)
  const forum = reponse.forum

  const liste = [...forums, forum]
  await setForums(liste)

  setForumId(forum.forum_id)
}

async function modifierForum(connexionWorker, forum, nom, securite, setForum) {
  const transaction = {
    forum_id: forum.forum_id,
    nom: nom || forum.nom,
    securite: securite || forum.securite,
  }

  const reponse = await connexionWorker.modifierForum(transaction)
  console.debug("Reponse modifier forum")
  const majForum = reponse.forum

  setForum(majForum)
}

async function chargerListeForums(connexionWorker, setForums) {
  console.debug("Charger liste de forums")
  const listeForums = await connexionWorker.requeteForums()
  console.debug("Reponse liste forums, %O", listeForums)
  setForums(listeForums)
}
