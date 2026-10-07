from datetime import date

from pydantic import BaseModel, ConfigDict


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    full_name: str
    email: str
    job_title: str
    job_level: int
    department: str
    country: str
    currency: str
    salary_minor: int
    gender: str
    hire_date: date
    status: str


class EmployeePage(BaseModel):
    items: list[EmployeeOut]
    page: int
    page_size: int
    total: int
