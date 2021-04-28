import React from 'react'

export function RenderChampMultilingue(props) {
  const champ = props.champ
  if(champ) {
    const langues = Object.keys(champ)
    langues.sort()
    return langues.map(l=>''+l+':'+champ[l]).join('/')
  } else {
    return props.defaut || ''
  }
  return ''
}
