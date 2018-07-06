openssl genrsa -out ${1}/private.pem 512
openssl rsa -in ${1}/private.pem -pubout > ${1}/keys.pub
