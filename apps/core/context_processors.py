
from utils.menu_config import MenuConfig


def menu_items(request):
    """Global context processor for menu items"""
    return {
        'menu_items': MenuConfig.get_menu_for_user(request)
    }