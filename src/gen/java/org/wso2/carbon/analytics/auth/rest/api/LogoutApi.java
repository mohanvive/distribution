package org.wso2.carbon.analytics.auth.rest.api;


import io.swagger.annotations.ApiParam;
import org.osgi.service.component.annotations.Component;
import org.wso2.carbon.analytics.auth.rest.api.factories.LogoutApiServiceFactory;
import org.wso2.msf4j.Microservice;
import org.wso2.msf4j.Request;

import javax.ws.rs.ApplicationPath;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;

/**
 * Logout API class.
 */
@Component(
        name = "LogoutApi",
        service = Microservice.class,
        immediate = true
)
@Path("/logout")
@Consumes({"application/json"})
@Produces({"application/json"})
@ApplicationPath("/logout")
@io.swagger.annotations.Api(description = "the logout API")
public class LogoutApi implements Microservice {
    private final LogoutApiService delegate = LogoutApiServiceFactory.getLogoutApi();

    @POST
    @Path("/{appName:(.*)}")
    @Consumes({"application/json"})
    @Produces({"application/json"})
    @io.swagger.annotations.ApiOperation(value = "", notes = "Logout Request to Stream Processor",
            response = void.class, tags = {})
    @io.swagger.annotations.ApiResponses(value = {
            @io.swagger.annotations.ApiResponse(code = 200, message = "Authorization Request Successful.",
                    response = void.class),

            @io.swagger.annotations.ApiResponse(code = 500, message = "An unexpected error occured.",
                    response = void.class)})
    public Response logoutAppNamePost(@ApiParam(value = "AppName", required = true) @PathParam("appName") String appName
            , @Context Request request)
            throws NotFoundException {
        return delegate.logoutAppNamePost(appName, request);
    }
}
