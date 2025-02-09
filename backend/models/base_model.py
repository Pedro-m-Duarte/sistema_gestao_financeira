class BaseModel:
    """
    Base Model class, defining from_json function
    """

    def to_dict(self):
        return self.__dict__

    @staticmethod
    def from_json(json_string):
        pass
