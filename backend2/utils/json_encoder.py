# pylint: disable=method-hidden
"""
Custom encoder to return dictionary (json) from Objects
"""

from json import JSONEncoder


class ComplexEncoder(JSONEncoder):
    """
    Custom encoder, extending flask's JSONEncoder class
    """

    def default(self, o):
        try:
            iterable = iter(o)
        except TypeError:
            pass
        else:
            return list(iterable)
        # Let the base class default method raise the TypeError
        return o.__dict__
