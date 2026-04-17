# VSpacer
Source: packages/vuetify/src/components/VGrid/VSpacer.ts

## Overview
Simple flex spacer. Applies `flex-grow: 1` to push sibling elements apart. Commonly used inside VToolbar, VAppBar, or VRow.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| (none) | -- | -- | -- |

VSpacer is a simple functional component with no props. It renders a `<div class="v-spacer">`.

## Slot Anatomy
- (no slots)

## Composable Hooks
- (none)

## SASS Hooks
- `.v-spacer`: `flex-grow: 1`

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Right-aligned toolbar actions | `<v-spacer>` between title and action buttons |
| Space between two groups | `<v-spacer>` between the groups |
| Push element to end of flex row | `<v-spacer>` before the element |
