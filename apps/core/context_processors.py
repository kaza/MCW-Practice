
def menu_items(request):
    """Global context processor for menu items"""
    items = [
        {
            'name': 'Calendar',
            'url': '/calendar/',
            'icon': 'fa-calendar-alt',
            'is_active': request.path.startswith('/calendar'),
        },
        {
            'name': 'Clients',
            'url': '/clients/',
            'icon': 'fa-users',
            'is_active': request.path.startswith('/clients'),
        },
        {
            'name': 'Reminders',
            'url': '/reminders/',
            'icon': 'fa-bell',
            'badge': '99+',
            'is_active': request.path.startswith('/reminders'),
        },
        # Add more menu items as needed
    ]
    return {'menu_items': items}