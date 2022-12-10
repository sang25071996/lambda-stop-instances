const RDS_CLIENT = require('@aws-sdk/client-rds');
const EC2_CLIENT = require("@aws-sdk/client-ec2");
const LIST_RDS_INSTANCES = JSON.parse(process.env.LIST_RDS_INSTANCES); //["database-test", "database-2"]
const LIST_EC2_INSTANCES = JSON.parse(process.env.LIST_EC2_INSTANCES); //["i-03474b36f30cf6e", "i-08788a9635c6f"]
const rds = new RDS_CLIENT.RDS({apiVersion: '2014-10-31', region: 'us-east-1'});
const ec2Client = new EC2_CLIENT.EC2({region: 'us-east-1'});

exports.handler = async (event) => {
    console.log(event);
    try {
        let INSTANCE_SIZE = LIST_RDS_INSTANCES.length;
        for (let instanceId = 0; instanceId < INSTANCE_SIZE; instanceId++) {
            const instanceName = LIST_RDS_INSTANCES[instanceId];
            const dbInstances = rds.describeDBInstances({
                DBInstanceIdentifier: instanceName
            });
            const instances = (await dbInstances).DBInstances;
            let instanceSize = instances.length;
            for (let dbInstanceId = 0; dbInstanceId < instanceSize; dbInstanceId++) {
                const instance = instances[dbInstanceId];
                if (instance.DBInstanceStatus === 'available') {
                    const message = `stop RDS database: ${instanceName}`;
                    console.log(message);
                    const stopDBInstance = await rds.stopDBInstance({DBInstanceIdentifier: instanceName});
                    console.log(stopDBInstance);
                }
            }
        }

        for (let i = 0; i < LIST_EC2_INSTANCES.length; i++) {
            const dbInstances = await ec2Client.describeInstances({
                InstanceIds: [LIST_EC2_INSTANCES[i]]
            });
            const ec2Reservations = dbInstances.Reservations;
            const instanceReservation = ec2Reservations[0];
            console.log('instanceReservation', instanceReservation);
            const ec2Instance = instanceReservation?.Instances[0];
            console.log('ec2Instance', ec2Instance);
            if (ec2Instance?.State?.Name === 'running') {
                const message = `stop EC2 Instance: ${ec2Instance.InstanceId}`;
                console.log(message);
                const resp = await ec2Client.stopInstances({
                    InstanceIds: [ec2Instance.InstanceId]
                });
                console.log(resp);
            }
        }

    } catch (e) {
        console.log(e);
    }
}