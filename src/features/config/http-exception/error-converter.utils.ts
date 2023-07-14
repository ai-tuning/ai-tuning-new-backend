import { ValidationError } from "@nestjs/common";

interface ValidationErrors {
    error: string
    data: {
        field: string,
        message: string,
        in: string
    }[]
}


//make validation error message array to key value pair object
export function convertError(
    errors: ValidationError[],
): ValidationErrors {
    return errors.reduce((result: ValidationErrors, error: ValidationError) => {
        if (error.constraints) {
            Object.entries(error.constraints).forEach(([_key, value]) => {
                result.data.push({
                    field: error.property,
                    message: value,
                    in: "body"
                })

            });

        }

        //nested validation error
        if (!error.constraints && error.children) {
            Object.entries(error.children).forEach(([_key, value]) => {
                result.data.push({
                    field: `${error.property}.${value.property}`,
                    message: Object.values(value.constraints)[0],
                    in: "body"
                })
            });
        }
        return result;
    }, { data: [], error: "Validation error" });
}
