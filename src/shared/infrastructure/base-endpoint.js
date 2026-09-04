export class BaseEndpoint {
    constructor(baseApi, endpointPath) {
        this.http = baseApi.http
        this.path = endpointPath
    }

    resource(id) {
        return `${this.path}/${id}`
    }

    getAll() {
        return this.http.get(this.path)
    }

    getById(id) {
        return this.http.get(this.resource(id))
    }

    create(payload) {
        return this.http.post(this.path, payload)
    }

    update(id, payload) {
        return this.http.put(this.resource(id), payload)
    }

    delete(id) {
        return this.http.delete(this.resource(id))
    }

    postAction(id, subPath, body = null) {
        return this.http.post(`${this.resource(id)}/${subPath}`, body)
    }
}
