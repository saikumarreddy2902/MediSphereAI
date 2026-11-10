from setuptools import setup, find_packages

setup(
    name="medisphere-ai",
    version="1.0.0",
    package_dir={"": "backend"},
    packages=find_packages(where="backend"),
)
