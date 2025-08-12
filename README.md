# CodinGame Engine

## Introduction

This is a node module to easily work/play with javascript or typsecript on different CodinGame projects (classic puzzles or turn-based games)

## Goal / Idea

We should be able to create a new project and npm install this project, which would create a template with "GameRules" file, "input" & "output" folders, and provide a few helpers (e.g. `readline()`), allowing to play CodinGame with your favorite IDE.

## Roadmap

1 - framework for classic puzzles (input - compute - output) :
    a - "init" a run with inputs and expected outputs
    b - simulate "readline" codingame utility
    c - simulate "console" codingame utilities

2 - build tool

3 - node module
    a - export utilities from 1 & 2
    b - create specific architecture during installation ("GameRules" file, "input" & "output" folders, etc.)

4 - framework for more advanced games
