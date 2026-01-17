---
allowed-tools: AskUserQuestion, Read, Glob, Grep, Write, Edit
argument-hint: [plan-file]
description: Interview to flesh out a plan/spec
---

Voici le plan actuel :

@$ARGUMENTS

Interroge-moi en détail à l’aide de l’outil AskUserQuestion sur absolument tout : implémentation technique, UI & UX, préoccupations, compromis, etc., mais veille à ce que les questions ne soient pas évidentes.

Sois très approfondi et continue à m’interroger en continu jusqu’à ce que ce soit terminé, puis écris la spécification dans $ARGUMENTS.
