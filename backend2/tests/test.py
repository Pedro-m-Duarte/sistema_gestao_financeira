"""module docstring"""

import unittest
from processor.main import Main

class Test(unittest.TestCase):
    """class docstring"""

    def test_main_function(self):
        """test docstring"""
        result = Main.run("test_result")
        self.assertEqual(result, "test_result", "Test unsuccessful.")

if __name__ == '__main__':
    unittest.main()
