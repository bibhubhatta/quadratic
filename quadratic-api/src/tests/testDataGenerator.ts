import { randomUUID } from 'crypto';
import { UserTeamRole } from 'quadratic-shared/typesAndSchemas';
import dbClient from '../dbClient';

export async function createTeam({
  teamArgs,
  userRoles,
}: {
  teamArgs?: {
    uuid?: string;
    name?: string;
    picture?: string | null;
    createdDate?: Date;
  };
  userRoles: UserTeamRole[];
}) {
  const team = await dbClient.team.create({
    data: {
      uuid: teamArgs?.uuid ?? randomUUID(),
      name: teamArgs?.name ?? 'Test Team',
      picture: teamArgs?.picture ?? null,
      createdDate: teamArgs?.createdDate ?? new Date(),
    },
  });

  const users = await Promise.all(
    userRoles.map(async (role) => {
      return dbClient.user.create({
        data: {
          auth0Id: randomUUID(),
          UserTeamRole: {
            create: [
              {
                role,
                teamId: team.id,
              },
            ],
          },
        },
      });
    })
  );

  return { team, users };
}
