The layout, structure, and functionality should match the dashboard shown in the reference image, but use a clean white design system instead of beige.

Use Next.js (App Router) + TypeScript + TailwindCSS + shadcn/ui + Recharts.

The design should feel like Stripe / Vercel / Linear dashboards — simple, bright, minimal, and professional.

Visual Design
Theme

Background: pure white

Card background: white

Borders: light gray (#e5e7eb)

Primary accent: blue (#2563eb)

Secondary accents: soft green, orange, purple for charts

Text:

Primary: #111827

Secondary: #6b7280

Style

Minimal

Rounded cards (12px radius)

Light shadows

Thin borders

Spacious padding

Simple typography

Avoid dark UI elements

Layout Structure
Top Navigation Bar

Include:

Left side:

WonKey logo

Navigation links:

Projects

Docs

API Keys

Right side:

notification bell icon

user email

avatar

logout button

Active navigation item should have a blue underline indicator.

Sidebar

Left sidebar inside the dashboard.

Sections:

Project selector

dropdown labeled "Projects"

Navigation

API Keys

Usage Limits

Logs

Analytics

Settings

Each item should include an icon and highlight when active.

Sidebar background should be white with subtle borders, not colored.

Main Dashboard Area
Header

Large title:

Payments API

Below the title add tabs:

API Keys

Usage Limits

Logs

Analytics

Active tab should have a blue underline.

Analytics Dashboard (Main Content)

The analytics tab contains four major sections.

1. Metric Cards Row

Three cards:

Total Requests

large number

small trend sparkline chart

Total Errors

number

error trend

7-day Active Users

number

growth indicator

Cards should contain:

title

large metric

mini chart

2. Requests Over Time

Large card with:

Title:

Requests Over Time

Controls:

1H

24H

7D

30D

Chart:

line or area chart

two datasets:

Success

Errors

Use Recharts.

3. Top Endpoints

Card containing:

Donut chart showing request distribution:

Examples:

GET /products
POST /orders
GET /users
GET /payments
Other

Include percentages.

4. Usage Logs Table

Card titled:

Usage Logs

Controls:

status filter

date range filter

download CSV button

Table columns:

Timestamp
Method
Path
Status
Latency
Key

Status should use colored badges:

green → 200

red → 400+

yellow → 300

Rows should have hover highlight.

API Keys Tab

Display:

Header

API Keys

Show:

number of active keys

Create Key button

Table columns:

Prefix
Status
Created
Last Used
Action

Actions:

revoke key

Below table show:

Copy your new key now

with a one-time copy box containing the generated key.

Buttons:

Copy

Dismiss

Usage Limits Tab

Form allowing configuration of:

requests_per_minute
window_seconds

Display current limits and allow editing.

Logs Tab

Query request logs with filters:

status
path
from date
to date

Display logs table with pagination.

Functional Requirements

The UI must integrate with the WonKey backend API.

Endpoints used:

Projects

GET /v1/projects
POST /v1/projects

API Keys

POST /v1/projects/{project_id}/keys
GET /v1/projects/{project_id}/keys
POST /v1/keys/{key_id}/revoke

Logs

GET /v1/projects/{project_id}/logs

Analytics

GET /v1/projects/{project_id}/analytics/overview
GET /v1/projects/{project_id}/analytics/timeseries
UX Requirements

loading skeletons

empty states

smooth tab switching

responsive layout

copy-to-clipboard functionality

modern SaaS feel

File Structure

Use a modular component architecture:

components/
  dashboard-layout
  sidebar
  navbar
  metric-card
  charts
  api-keys-table
  logs-table
  analytics-cards

app/
  projects/
  projects/[projectId]/
Final Goal

Produce a clean white SaaS dashboard for WonKey that matches the layout and functionality of the reference design while looking like a modern production product.

Avoid generic admin template styling. Use a simple white interface with subtle borders and blue accents.

Make sure to Optimize it's performance so that it will not have a bad response and time in lighthouse.