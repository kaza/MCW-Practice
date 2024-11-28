# SimplePractice

## Project Structure


SimplePractice/
│
├── manage.py
├── requirements.txt
├── .env
├── .gitignore
│
├── config/                     # Project configuration
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
│
├── static/                     # Project-wide static files
│   ├── css/
│   ├── js/
│   └── images/
│
├── templates/                  # Project-wide templates
│   ├── base.html
│   ├── components/            # Reusable components
│   └── layouts/               # Base layouts
│
├── apps/                      # Application modules
│   ├── accounts/             # User authentication and profiles
│   │   ├── migrations/
│   │   ├── templates/
│   │   │   └── accounts/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── forms.py
│   │   ├── models.py
│   │   ├── urls.py
│   │   └── views.py
│   │
│   ├── admin_dashboard/      # Admin dashboard specific
│   │   ├── migrations/
│   │   ├── templates/
│   │   │   └── admin_dashboard/
│   │   ├── static/
│   │   │   └── admin_dashboard/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── forms.py
│   │   ├── models.py
│   │   ├── urls.py
│   │   └── views.py
│   │
│   ├── clinician_dashboard/  # Clinician dashboard specific
│   │   ├── migrations/
│   │   ├── templates/
│   │   │   └── clinician_dashboard/
│   │   ├── static/
│   │   │   └── clinician_dashboard/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── forms.py
│   │   ├── models.py
│   │   ├── urls.py
│   │   └── views.py
│   │
│   └── client_dashboard/     # Client dashboard specific
│       ├── migrations/
│       ├── templates/
│       │   └── client_dashboard/
│       ├── static/
│       │   └── client_dashboard/
│       ├── __init__.py
│       ├── apps.py
│       ├── forms.py
│       ├── models.py
│       ├── urls.py
│       └── views.py
│
└── utils/                    # Shared utilities
    ├── __init__.py
    ├── decorators.py
    ├── mixins.py
    └── helpers.py


## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd SimplePractice
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

To run the development server, use:


python manage.py runserver